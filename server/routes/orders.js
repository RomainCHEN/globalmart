import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/orders — create order
router.post('/', requireAuth, async (req, res) => {
    try {
        const { items, shipping, payment_method } = req.body;

        const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: req.user.id,
                total,
                shipping_name: shipping?.name || '',
                shipping_street: shipping?.street || '',
                shipping_city: shipping?.city || '',
                shipping_zip: shipping?.zip || '',
                shipping_country: shipping?.country || '',
                payment_method: payment_method || 'credit_card',
                status: 'pending'
            })
            .select()
            .single();

        if (orderError) return res.status(400).json({ error: orderError.message });

        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.name,
            product_image: item.image || '',
            price: item.price,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) return res.status(400).json({ error: itemsError.message });

        // Clear user's cart after successful order
        await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', req.user.id);

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders — user's orders (with optional status filter)
router.get('/', requireAuth, async (req, res) => {
    try {
        let query = supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (req.query.status) {
            query = query.eq('status', req.query.status);
        }

        const { data, error } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/seller — orders containing seller's products
router.get('/seller', requireAuth, async (req, res) => {
    try {
        // Get seller's store
        const { data: store } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('seller_id', req.user.id)
            .single();

        let productIds = [];
        if (store) {
            const { data: storeProducts } = await supabaseAdmin
                .from('products')
                .select('id')
                .eq('store_id', store.id);
            if (storeProducts) productIds = storeProducts.map(p => p.id);
        }

        // Also include products directly owned by seller
        const { data: sellerProducts } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('seller_id', req.user.id);
        if (sellerProducts) {
            sellerProducts.forEach(p => {
                if (!productIds.includes(p.id)) productIds.push(p.id);
            });
        }

        if (productIds.length === 0) {
            return res.json({ orders: [], total: 0 });
        }

        // Get order items for these products
        const { data: orderItems } = await supabaseAdmin
            .from('order_items')
            .select('order_id')
            .in('product_id', productIds);

        if (!orderItems || orderItems.length === 0) {
            return res.json({ orders: [], total: 0 });
        }

        const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];

        let query = supabaseAdmin
            .from('orders')
            .select('*, order_items(*), profiles:user_id(name, email)')
            .in('id', orderIds)
            .order('created_at', { ascending: false });

        if (req.query.status) {
            query = query.eq('status', req.query.status);
        }

        const { data: orders, error } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json({ orders, total: orders.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id — get order detail (for customer or seller)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        // First try as customer
        let { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Order not found' });

        // Allow access if user is the customer, a seller, or admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (data.user_id !== req.user.id && profile?.role !== 'admin' && profile?.role !== 'seller') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/status — vendor/admin update status (ship, hold, deliver)
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'seller')) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'shipped', 'delivered', 'hold', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Build update with date tracking
        const updates = { status, updated_at: new Date().toISOString() };
        if (status === 'shipped') updates.shipped_at = new Date().toISOString();
        if (status === 'delivered') updates.delivered_at = new Date().toISOString();
        if (status === 'hold') updates.hold_at = new Date().toISOString();
        if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/cancel — customer cancels order (only if pending or hold)
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    try {
        // Get current order
        const { data: order, error: getErr } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (getErr || !order) return res.status(404).json({ error: 'Order not found' });

        if (order.status !== 'pending' && order.status !== 'hold') {
            return res.status(400).json({ error: 'Only pending or hold orders can be cancelled' });
        }

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

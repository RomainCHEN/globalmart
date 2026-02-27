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
                status: 'ordered'
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

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders — user's orders
router.get('/', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/seller — orders containing seller's products
router.get('/seller', requireAuth, async (req, res) => {
    try {
        // Get seller's product IDs
        const { data: sellerProducts } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('seller_id', req.user.id);

        if (!sellerProducts || sellerProducts.length === 0) {
            return res.json({ orders: [], total: 0 });
        }

        const productIds = sellerProducts.map(p => p.id);

        // Get order items for these products
        const { data: orderItems } = await supabaseAdmin
            .from('order_items')
            .select('order_id')
            .in('product_id', productIds);

        if (!orderItems || orderItems.length === 0) {
            return res.json({ orders: [], total: 0 });
        }

        const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];

        // Get the orders
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*), profiles!orders_user_id_fkey(name, email)')
            .in('id', orderIds)
            .order('created_at', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });
        res.json({ orders, total: orders.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();
        if (error) return res.status(404).json({ error: 'Order not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/status — admin/seller update status
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
        const validStatuses = ['ordered', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
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

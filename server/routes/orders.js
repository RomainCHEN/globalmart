import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/orders — create order
router.post('/', requireAuth, async (req, res) => {
    let createdOrderId = null;
    try {
        const { items, shipping, payment_method, store_id } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required and cannot be empty' });
        }

        let total = 0;
        for (const item of items) {
            total += Number(item.price) * Number(item.quantity);
        }

        const { data: profile } = await supabaseAdmin.from('profiles').select('name, role').eq('id', req.user.id).single();

        const initialHistory = [{
            status: 'pending',
            timestamp: new Date().toISOString(),
            actor_name: profile?.name || 'Customer',
            actor_role: profile?.role || 'user'
        }];

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: req.user.id,
                store_id: store_id || null,
                total: total,
                shipping_name: shipping?.name || '',
                shipping_street: shipping?.street || '',
                shipping_city: shipping?.city || '',
                shipping_zip: shipping?.zip || '',
                shipping_country: shipping?.country || '',
                payment_method: payment_method || 'credit_card',
                status: 'pending',
                status_history: initialHistory
            })
            .select()
            .single();

        if (orderError) return res.status(400).json({ error: orderError.message });
        createdOrderId = order.id;

        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.name || 'Unknown Product',
            product_image: item.image || '',
            price: Number(item.price),
            quantity: Number(item.quantity)
        }));

        const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
        if (itemsError) {
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return res.status(400).json({ error: itemsError.message });
        }

        try { await supabaseAdmin.from('cart_items').delete().eq('user_id', req.user.id); } catch {}

        res.status(201).json(order);
    } catch (err) {
        if (createdOrderId) await supabaseAdmin.from('orders').delete().eq('id', createdOrderId);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders — user's orders
router.get('/', requireAuth, async (req, res) => {
    try {
        let query = supabaseAdmin
            .from('orders')
            .select('*, order_items(*), stores(id, name, logo)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (req.query.status) query = query.eq('status', req.query.status);

        const { data, error } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/seller
router.get('/seller', requireAuth, async (req, res) => {
    try {
        const { data: stores } = await supabaseAdmin.from('stores').select('id').eq('seller_id', req.user.id);
        let storeIds = stores ? stores.map(s => s.id) : [];

        let productQuery = supabaseAdmin
            .from('products')
            .select('id')
            .or(`seller_id.eq.${req.user.id}${storeIds.length > 0 ? `,store_id.in.(${storeIds.join(',')})` : ''}`);

        const { data: products } = await productQuery;
        const productIds = products ? products.map(p => p.id) : [];
        if (productIds.length === 0) return res.json({ orders: [], total: 0 });

        const { data: orderItems } = await supabaseAdmin.from('order_items').select('order_id').in('product_id', productIds);
        if (!orderItems || orderItems.length === 0) return res.json({ orders: [], total: 0 });

        const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];

        let query = supabaseAdmin
            .from('orders')
            .select('*, order_items(*), profiles:user_id(name, email), stores(id, name, logo)')
            .in('id', orderIds)
            .order('created_at', { ascending: false });

        if (req.query.status) query = query.eq('status', req.query.status);

        const { data: orders, error } = await query;
        if (error) return res.status(400).json({ error: error.message });
        
        const filteredOrders = orders.map(order => ({
            ...order,
            order_items: order.order_items.filter(item => productIds.includes(item.product_id))
        }));

        res.json({ orders: filteredOrders, total: filteredOrders.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id — detail
router.get('/:id', requireAuth, async (req, res) => {
    try {
        let { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*), stores(id, name, logo)')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Order not found' });

        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', req.user.id).single();
        if (data.user_id !== req.user.id && profile?.role !== 'admin' && profile?.role !== 'seller') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/status — vendor/admin update
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { data: profile } = await supabaseAdmin.from('profiles').select('name, role').eq('id', req.user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'seller')) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { status, tracking_number } = req.body;
        const validStatuses = ['pending', 'shipped', 'delivered', 'hold', 'cancelled', 'refund_requested', 'refunded', 'ticket_issued', 'completed'];
        if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const { data: currentOrder } = await supabaseAdmin.from('orders').select('status, status_history').eq('id', req.params.id).single();
        if (!currentOrder) return res.status(404).json({ error: 'Order not found' });

        // Logic check: Can't deliver if not shipped
        if (status === 'delivered' && currentOrder.status !== 'shipped') {
            return res.status(400).json({ error: 'Order must be shipped before it can be marked as delivered' });
        }

        const history = currentOrder?.status_history || [];
        
        const newRecord = {
            status,
            timestamp: new Date().toISOString(),
            actor_name: profile.name || 'Unknown',
            actor_role: profile.role,
            tracking_number: status === 'shipped' ? tracking_number : undefined
        };

        const updates = { 
            status, 
            updated_at: new Date().toISOString(),
            status_history: [...history, newRecord]
        };
        
        if (status === 'shipped') {
            updates.shipped_at = new Date().toISOString();
            if (tracking_number) updates.tracking_number = tracking_number;
        }
        if (status === 'ticket_issued') updates.ticket_issued_at = new Date().toISOString();
        if (status === 'delivered') updates.delivered_at = new Date().toISOString();
        if (status === 'hold') updates.hold_at = new Date().toISOString();
        if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
        if (status === 'refunded') updates.refunded_at = new Date().toISOString();
        if (status === 'completed') updates.completed_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin.from('orders').update(updates).eq('id', req.params.id).select();
        if (error) return res.status(400).json({ error: error.message });
        res.json(data && data.length > 0 ? data[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/cancel — customer cancels
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const [{ data: order }, { data: profile }] = await Promise.all([
            supabaseAdmin.from('orders').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single(),
            supabaseAdmin.from('profiles').select('name, role').eq('id', req.user.id).single()
        ]);

        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'pending' && order.status !== 'hold') {
            return res.status(400).json({ error: 'Only pending or hold orders can be cancelled' });
        }

        const history = order.status_history || [];
        const newRecord = {
            status: 'cancelled',
            timestamp: new Date().toISOString(),
            actor_name: profile?.name || 'Customer',
            actor_role: profile?.role || 'user'
        };

        const { data, error } = await supabaseAdmin.from('orders').update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status_history: [...history, newRecord]
        }).eq('id', req.params.id).select();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data && data.length > 0 ? data[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/refund — customer request
router.patch('/:id/refund', requireAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const [{ data: order }, { data: profile }] = await Promise.all([
            supabaseAdmin.from('orders').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single(),
            supabaseAdmin.from('profiles').select('name, role').eq('id', req.user.id).single()
        ]);

        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'delivered') return res.status(400).json({ error: 'Only delivered orders can request refund' });

        const history = order.status_history || [];
        const newRecord = {
            status: 'refund_requested',
            timestamp: new Date().toISOString(),
            actor_name: profile?.name || 'Customer',
            actor_role: profile?.role || 'user',
            notes: reason || 'No reason provided'
        };

        const { data, error } = await supabaseAdmin.from('orders').update({
            status: 'refund_requested',
            refund_requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status_history: [...history, newRecord]
        }).eq('id', req.params.id).select();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data && data.length > 0 ? data[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/approve-refund
router.patch('/:id/approve-refund', requireAuth, async (req, res) => {
    try {
        const { data: profile } = await supabaseAdmin.from('profiles').select('name, role').eq('id', req.user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'seller')) return res.status(403).json({ error: 'Not authorized' });

        const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single();
        if (!order || order.status !== 'refund_requested') return res.status(400).json({ error: 'Order is not in refund_requested status' });

        const history = order.status_history || [];
        const newRecord = { status: 'refunded', timestamp: new Date().toISOString(), actor_name: profile.name || 'Seller', actor_role: profile.role };

        const { data, error } = await supabaseAdmin.from('orders').update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
            status_history: [...history, newRecord]
        }).eq('id', req.params.id).select();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data && data.length > 0 ? data[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/orders/:id/deny-refund — vendor/admin deny
router.patch('/:id/deny-refund', requireAuth, async (req, res) => {
    try {
        const { data: profile } = await supabaseAdmin.from('profiles').select('name, role').eq('id', req.user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'seller')) return res.status(403).json({ error: 'Not authorized' });

        const { reason } = req.body;
        const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single();
        if (!order || order.status !== 'refund_requested') return res.status(400).json({ error: 'Order is not in refund_requested status' });

        const history = order.status_history || [];
        const newRecord = { 
            status: 'delivered', 
            timestamp: new Date().toISOString(), 
            actor_name: profile.name || 'Seller', 
            actor_role: profile.role,
            notes: `Refund denied: ${reason || 'No reason provided'}`
        };

        const { data, error } = await supabaseAdmin.from('orders').update({
            status: 'delivered', // Revert to delivered
            updated_at: new Date().toISOString(),
            status_history: [...history, newRecord]
        }).eq('id', req.params.id).select();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data && data.length > 0 ? data[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

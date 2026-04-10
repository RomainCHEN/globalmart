import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/products/:productId/reviews — handled via /api/reviews?product_id=xxx
// We mount this at /api/reviews
router.get('/', async (req, res) => {
    try {
        const { product_id } = req.query;
        if (!product_id) return res.status(400).json({ error: 'product_id required' });

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .select('*, profiles(name, avatar)')
            .eq('product_id', product_id)
            .order('created_at', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews — create review
router.post('/', requireAuth, async (req, res) => {
    try {
        const { product_id, rating, title, body } = req.body;

        // Check if user has purchased this product and it is delivered
        // We join orders and order_items to find a matching product_id in a 'delivered' order for this user
        const { data: deliveredOrders, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                id, 
                status, 
                order_items!inner(product_id)
            `)
            .eq('user_id', req.user.id)
            .eq('status', 'delivered')
            .eq('order_items.product_id', product_id);

        if (orderError) {
            console.error('[Review Error] Order check failed:', orderError);
            return res.status(400).json({ error: 'Failed to verify purchase status' });
        }

        if (!deliveredOrders || deliveredOrders.length === 0) {
            return res.status(403).json({ 
                error: 'Only users who have purchased and received this product can leave a review. Please ensure your order status is "delivered".' 
            });
        }

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert({
                product_id,
                user_id: req.user.id,
                rating,
                title: title || '',
                body: body || ''
            })
            .select('*, profiles(name, avatar)')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'You have already reviewed this product' });
            }
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reviews/seller — Get reviews for seller's products
router.get('/seller', requireAuth, async (req, res) => {
    try {
        // 1. Get seller's stores
        const { data: stores } = await supabaseAdmin.from('stores').select('id').eq('seller_id', req.user.id);
        const storeIds = stores?.map(s => s.id) || [];
        if (storeIds.length === 0) return res.json([]);

        // 2. Get reviews for products in these stores
        const { data, error } = await supabaseAdmin
            .from('reviews')
            .select('*, profiles(name, avatar), products!inner(id, name, name_zh, store_id)')
            .in('products.store_id', storeIds)
            .order('created_at', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/reviews/:id/reply — Seller reply to a review
router.patch('/:id/reply', requireAuth, async (req, res) => {
    try {
        const { reply } = req.body;
        // Verify ownership
        const { data: review } = await supabaseAdmin.from('reviews').select('*, products!inner(store_id)').eq('id', req.params.id).single();
        if (!review) return res.status(404).json({ error: 'Review not found' });
        
        const { data: store } = await supabaseAdmin.from('stores').select('seller_id').eq('id', review.products.store_id).single();
        if (store?.seller_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .update({ 
                seller_reply: reply,
                replied_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/reviews/:id/flag — Seller flag review as risky
router.patch('/:id/flag', requireAuth, async (req, res) => {
    try {
        const { is_flagged } = req.body;
        const { data: review } = await supabaseAdmin.from('reviews').select('*, products!inner(store_id)').eq('id', req.params.id).single();
        if (!review) return res.status(404).json({ error: 'Review not found' });
        
        const { data: store } = await supabaseAdmin.from('stores').select('seller_id').eq('id', review.products.store_id).single();
        if (store?.seller_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .update({ is_risk_flagged: is_flagged })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/reviews/:id — User can delete their own review
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('reviews')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

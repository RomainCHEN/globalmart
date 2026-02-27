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

// DELETE /api/reviews/:id
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

import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/wishlist
router.get('/', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select('*, products(*, categories(name, slug))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/wishlist — add to wishlist
router.post('/', requireAuth, async (req, res) => {
    try {
        const { product_id } = req.body;
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .insert({ user_id: req.user.id, product_id })
            .select()
            .single();
        if (error) {
            if (error.code === '23505') {
                return res.status(200).json({ message: 'Already in wishlist' });
            }
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', requireAuth, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('wishlists')
            .delete()
            .eq('user_id', req.user.id)
            .eq('product_id', req.params.productId);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

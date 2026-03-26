import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/wishlist
router.get('/', requireAuth, async (req, res) => {
    try {
        // 1. Get user profile for birthday check
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('birthday_month, birthday_day')
            .eq('id', req.user.id)
            .single();

        const today = new Date();
        const isBirthday = profile && 
                           profile.birthday_month === (today.getMonth() + 1) && 
                           profile.birthday_day === today.getDate();

        // 2. Get wishlist items
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select('*, products(*, categories(name, slug))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });

        // 3. Apply discount if it's birthday
        if (isBirthday && data) {
            data.forEach(item => {
                if (item.products) {
                    item.products.original_price = item.products.price;
                    item.products.price = Math.round(item.products.price * 0.9 * 100) / 100;
                    item.is_birthday_discount = true;
                }
            });
        }

        res.json({ data, isBirthday });
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

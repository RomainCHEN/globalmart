import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/cart — get user's cart items with product info
router.get('/', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('cart_items')
            .select('*, products(id, name, name_zh, description, description_zh, price, original_price, image, stock, category_id, categories(name, slug), rating, tags, store_id, stores(id, name, logo, verified))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: true });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cart — add item to cart (or increment quantity)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        if (!product_id) return res.status(400).json({ error: 'product_id required' });

        // Check if already in cart
        const { data: existing } = await supabaseAdmin
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            // Increment quantity
            const { data, error } = await supabaseAdmin
                .from('cart_items')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) return res.status(400).json({ error: error.message });
            return res.json(data);
        }

        // Insert new
        const { data, error } = await supabaseAdmin
            .from('cart_items')
            .insert({ user_id: req.user.id, product_id, quantity })
            .select()
            .single();
        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/cart/:product_id — update item quantity
router.put('/:product_id', requireAuth, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

        const { data, error } = await supabaseAdmin
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', req.user.id)
            .eq('product_id', req.params.product_id)
            .select()
            .single();
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart/:product_id — remove item from cart
router.delete('/:product_id', requireAuth, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', req.user.id)
            .eq('product_id', req.params.product_id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart — clear entire cart
router.delete('/', requireAuth, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', req.user.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cart/sync — sync localStorage cart to server (called on login)
router.post('/sync', requireAuth, async (req, res) => {
    try {
        const { items } = req.body; // [{product_id, quantity}]
        if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

        for (const item of items) {
            if (!item.product_id || !item.quantity) continue;
            const { data: existing } = await supabaseAdmin
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', req.user.id)
                .eq('product_id', item.product_id)
                .single();

            if (existing) {
                // Keep the larger quantity
                if (item.quantity > existing.quantity) {
                    await supabaseAdmin
                        .from('cart_items')
                        .update({ quantity: item.quantity })
                        .eq('id', existing.id);
                }
            } else {
                await supabaseAdmin
                    .from('cart_items')
                    .insert({ user_id: req.user.id, product_id: item.product_id, quantity: item.quantity });
            }
        }

        // Return updated cart
        const { data } = await supabaseAdmin
            .from('cart_items')
            .select('*, products(id, name, name_zh, description, description_zh, price, original_price, image, stock, category_id, categories(name, slug), rating, tags, store_id, stores(id, name, logo, verified))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: true });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

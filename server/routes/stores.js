import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/stores — create a store (seller only, one per seller)
router.post('/', requireAuth, async (req, res) => {
    try {
        // Check if seller already has a store
        const { data: existing } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('seller_id', req.user.id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'You already have a store', store: existing });
        }

        const { name, description, logo } = req.body;
        if (!name) return res.status(400).json({ error: 'Store name is required' });

        const { data, error } = await supabaseAdmin
            .from('stores')
            .insert({
                seller_id: req.user.id,
                name,
                description: description || '',
                logo: logo || '',
                verified: false,
                rating: 0
            })
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stores — list all stores
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('stores')
            .select('*, profiles(name, avatar)')
            .order('created_at', { ascending: false });
        if (error) return res.status(400).json({ error: error.message });

        // Get product counts for each store
        const storesWithCounts = await Promise.all(data.map(async (store) => {
            const { count } = await supabaseAdmin
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', store.id);
            return { ...store, product_count: count || 0 };
        }));

        res.json(storesWithCounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stores/:id
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('stores')
            .select('*, profiles(name)')
            .eq('id', req.params.id)
            .single();
        if (error) return res.status(404).json({ error: 'Store not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stores/:id/products
router.get('/:id/products', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*, categories(name, slug)')
            .eq('store_id', req.params.id)
            .order('created_at', { ascending: false });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/stores/:id — update store (seller only)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { data: store } = await supabaseAdmin
            .from('stores')
            .select('seller_id')
            .eq('id', req.params.id)
            .single();

        if (!store || store.seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { name, name_zh, description, description_zh, logo, banner } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (name_zh !== undefined) updates.name_zh = name_zh;
        if (description !== undefined) updates.description = description;
        if (description_zh !== undefined) updates.description_zh = description_zh;
        if (logo !== undefined) updates.logo = logo;
        if (banner !== undefined) updates.banner = banner;

        const { data, error } = await supabaseAdmin
            .from('stores')
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

export default router;

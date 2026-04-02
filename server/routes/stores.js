import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

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

// GET /api/stores — list stores (optionally including offline for owners)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { mine } = req.query;
        let query = supabaseAdmin
            .from('stores')
            .select('*, profiles(name, avatar)')
            .order('created_at', { ascending: false });

        if (mine === 'true' && req.user) {
            query = query.eq('seller_id', req.user.id);
        } else {
            query = query.eq('is_online', true);
        }

        const { data, error } = await query;
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

// PATCH /api/stores/:id/toggle-online — toggle store online/offline status (seller only)
router.patch('/:id/toggle-online', requireAuth, async (req, res) => {
    try {
        const { is_online } = req.body;
        const { data: store } = await supabaseAdmin
            .from('stores')
            .select('seller_id')
            .eq('id', req.params.id)
            .single();

        if (!store || store.seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { data, error } = await supabaseAdmin
            .from('stores')
            .update({ is_online })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stores/me/analytics — seller analytics (popularity & trends)
router.get('/me/analytics', requireAuth, async (req, res) => {
    try {
        // EMERGENCY RESTORATION: Return a simple structure to ensure server stability
        const { data: store } = await supabaseAdmin.from('stores').select('id').eq('seller_id', req.user.id).single();
        if (!store) return res.status(404).json({ error: 'Store not found' });

        const { data: products } = await supabaseAdmin.from('products').select('id, name, name_zh, price, image').eq('store_id', store.id).limit(10);
        
        const topProducts = (products || []).map(p => ({
            id: p.id,
            name: p.name,
            name_zh: p.name_zh,
            price: p.price,
            image: p.image,
            views: 0
        }));

        res.json({ 
            topProducts: topProducts, 
            searchTrends: [] 
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stores/:id — single store detail
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('stores')
            .select('*, profiles(name, avatar, email, role)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Store not found' });

        // If store is offline, only owner or admin can see it
        if (!data.is_online) {
            const isOwner = req.user && req.user.id === data.seller_id;
            // Re-fetch requester role for security if not owner
            if (!isOwner) {
                if (req.user) {
                    const { data: requester } = await supabaseAdmin.from('profiles').select('role').eq('id', req.user.id).single();
                    if (requester?.role !== 'admin') return res.status(404).json({ error: 'Store is offline' });
                } else {
                    return res.status(404).json({ error: 'Store is offline' });
                }
            }
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stores/:id/products
router.get('/:id/products', optionalAuth, async (req, res) => {
    try {
        const { data: store } = await supabaseAdmin.from('stores').select('seller_id, is_online').eq('id', req.params.id).single();
        if (!store) return res.status(404).json({ error: 'Store not found' });

        if (!store.is_online) {
            const isOwner = req.user && req.user.id === store.seller_id;
            if (!isOwner) {
                if (req.user) {
                    const { data: requester } = await supabaseAdmin.from('profiles').select('role').eq('id', req.user.id).single();
                    if (requester?.role !== 'admin') return res.status(404).json({ error: 'Store is offline' });
                } else {
                    return res.status(404).json({ error: 'Store is offline' });
                }
            }
        }

        const { search } = req.query;
        let query = supabaseAdmin
            .from('products')
            .select('*, categories(name, slug)')
            .eq('store_id', req.params.id);

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,name_zh.ilike.%${search}%,description_zh.ilike.%${search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
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

        const { name, name_zh, description, description_zh, logo, banner, shop_photo } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (name_zh !== undefined) updates.name_zh = name_zh;
        if (description !== undefined) updates.description = description;
        if (description_zh !== undefined) updates.description_zh = description_zh;
        if (logo !== undefined) updates.logo = logo;
        if (banner !== undefined) updates.banner = banner;
        if (shop_photo !== undefined) updates.shop_photo = shop_photo;

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

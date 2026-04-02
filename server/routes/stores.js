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
        // 1. Get seller's store and products
        const { data: store } = await supabaseAdmin.from('stores').select('id').eq('seller_id', req.user.id).single();
        if (!store) return res.status(404).json({ error: 'Store not found' });

        const { data: products } = await supabaseAdmin.from('products').select('id, name, category_id').eq('store_id', store.id);
        if (!products || products.length === 0) return res.json({ topProducts: [], searchTrends: [] });

        const productIds = products.map(p => p.id);
        const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];

        // 2. Get top products by browse count
        // Using count for each product
        const topProductsData = await Promise.all(products.map(async (p) => {
            const { count } = await supabaseAdmin
                .from('browse_logs')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', p.id);
            return { ...p, views: count || 0 };
        }));

        const topProducts = topProductsData
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        // 3. Get search trends related to seller's products/categories
        // Extract relevant keywords from seller's products to filter trends
        const sellerKeywords = new Set();
        products.forEach(p => {
            p.name.split(/\s+/).forEach(word => {
                const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (clean.length > 2) sellerKeywords.add(clean);
            });
        });

        const { data: searchLogs } = await supabaseAdmin
            .from('search_logs')
            .select('query')
            .order('created_at', { ascending: false })
            .limit(500);
        
        const keywords = (searchLogs || []).map(l => l.query.toLowerCase().trim());
        const trendCounts = {};
        
        keywords.forEach(k => {
            // Check if this search query is relevant to the seller
            const isRelevant = Array.from(sellerKeywords).some(sk => k.includes(sk));
            if (isRelevant) {
                trendCounts[k] = (trendCounts[k] || 0) + 1;
            }
        });

        const searchTrends = Object.entries(trendCounts)
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        res.json({ topProducts, searchTrends });
    } catch (err) {
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
            const isAdmin = req.user && data.profiles?.role === 'admin'; // wait, role check logic
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

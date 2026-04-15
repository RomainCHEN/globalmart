import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/products — list with search, filter, pagination
router.get('/', async (req, res) => {
    try {
        const { search, category, min_price, max_price, sort, page = 1, limit = 20, tag, include_disabled } = req.query;

        // A21: Only show enabled products from online stores for the public storefront
        let query = supabaseAdmin
            .from('products')
            .select('*, categories(name, slug), product_images(url, sort_order), stores!inner(id, name, logo, verified, is_online)', { count: 'exact' });

        if (include_disabled !== 'true') {
            query = query.eq('enabled', true);
            query = query.eq('stores.is_online', true);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,name_zh.ilike.%${search}%,description_zh.ilike.%${search}%,tags.cs.{"${search}"}`);
        }
        if (category) {
            query = query.eq('category_id', category);
        }
        if (min_price) {
            query = query.gte('price', parseFloat(min_price));
        }
        if (max_price) {
            query = query.lte('price', parseFloat(max_price));
        }
        if (tag) {
            query = query.contains('tags', [tag]);
        }

        // Sorting
        switch (sort) {
            case 'price_asc': query = query.order('price', { ascending: true }); break;
            case 'price_desc': query = query.order('price', { ascending: false }); break;
            case 'rating': query = query.order('rating', { ascending: false }); break;
            case 'newest': query = query.order('created_at', { ascending: false }); break;
            default: query = query.order('created_at', { ascending: false });
        }

        // Pagination
        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });

        res.json({
            products: data.map(p => ({
                ...p,
                is_birthday_promo_enabled: p.specs?.is_birthday_promo_enabled || false,
                birthday_promo_discount: p.specs?.birthday_promo_discount || 0
            })),
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*, categories(name, slug), product_images(id, url, sort_order), stores(id, name, logo, verified)')
            .eq('id', req.params.id)
            .single();
        if (error) return res.status(404).json({ error: 'Product not found' });
        res.json({
            ...data,
            is_birthday_promo_enabled: data.specs?.is_birthday_promo_enabled || false,
            birthday_promo_discount: data.specs?.birthday_promo_discount || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products — create (seller only)
router.post('/', requireAuth, async (req, res) => {
    try {
        // Check seller role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
            return res.status(403).json({ error: 'Only sellers can create products' });
        }

        const { name, description, price, original_price, category_id, stock, tags, specs, image, images, is_birthday_promo_enabled, birthday_promo_discount } = req.body;

        // Get seller's store
        const { data: store } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('seller_id', req.user.id)
            .single();

        const mergedSpecs = {
            ...(specs || {}),
            is_birthday_promo_enabled: is_birthday_promo_enabled || false,
            birthday_promo_discount: birthday_promo_discount || 0
        };

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                seller_id: req.user.id,
                store_id: store?.id,
                category_id,
                name,
                description,
                price,
                original_price,
                stock: stock || 0,
                tags: tags || [],
                specs: mergedSpecs,
                image: image || ''
            })
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });

        // Add images if provided
        if (images && images.length > 0) {
            const imageRows = images.map((url, i) => ({
                product_id: data.id,
                url,
                sort_order: i
            }));
            await supabaseAdmin.from('product_images').insert(imageRows);
        }

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/products/:id — update (seller only)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { data: product } = await supabaseAdmin
            .from('products')
            .select('seller_id')
            .eq('id', req.params.id)
            .single();

        if (!product || product.seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const newImages = req.body.images || [];
        const updates = { ...req.body, updated_at: new Date().toISOString() };
        delete updates.id;
        delete updates.seller_id;
        delete updates.images;

        if ('is_birthday_promo_enabled' in updates || 'birthday_promo_discount' in updates) {
            const { data: prodData } = await supabaseAdmin.from('products').select('specs').eq('id', req.params.id).single();
            updates.specs = {
                ...(prodData?.specs || {}),
                ...(updates.specs || {}),
                is_birthday_promo_enabled: updates.is_birthday_promo_enabled !== undefined ? updates.is_birthday_promo_enabled : prodData?.specs?.is_birthday_promo_enabled,
                birthday_promo_discount: updates.birthday_promo_discount !== undefined ? updates.birthday_promo_discount : prodData?.specs?.birthday_promo_discount
            };
            delete updates.is_birthday_promo_enabled;
            delete updates.birthday_promo_discount;
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        
        res.json({
            ...data,
            is_birthday_promo_enabled: data.specs?.is_birthday_promo_enabled || false,
            birthday_promo_discount: data.specs?.birthday_promo_discount || 0
        });

        // Insert new images into product_images (de-duplicate against existing)
        if (newImages && newImages.length > 0) {
            const { data: existingImgs } = await supabaseAdmin.from('product_images')
                .select('url').eq('product_id', req.params.id);
            const existingUrls = new Set((existingImgs || []).map(i => i.url));
            const { data: maxOrderData } = await supabaseAdmin.from('product_images')
                .select('sort_order').eq('product_id', req.params.id)
                .order('sort_order', { ascending: false }).limit(1);
            let nextOrder = (maxOrderData?.[0]?.sort_order ?? -1) + 1;
            const newRows = newImages
                .filter(url => url && !existingUrls.has(url))
                .map((url, i) => ({ product_id: req.params.id, url, sort_order: nextOrder + i }));
            if (newRows.length > 0) {
                await supabaseAdmin.from('product_images').insert(newRows);
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', req.params.id)
            .eq('seller_id', req.user.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/products/:id/toggle — enable/disable product (seller)
router.patch('/:id/toggle', requireAuth, async (req, res) => {
    try {
        const { enabled } = req.body;
        const { data: product } = await supabaseAdmin
            .from('products')
            .select('seller_id')
            .eq('id', req.params.id)
            .single();

        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Check if admin or owner
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (product.seller_id !== req.user.id && profile?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .update({ enabled: !!enabled })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/products/:id/images/reorder — set primary image / reorder
router.patch('/:id/images/reorder', requireAuth, async (req, res) => {
    try {
        const { imageIds } = req.body; // ordered array of image IDs, first = primary
        if (!imageIds || !Array.isArray(imageIds)) {
            return res.status(400).json({ error: 'imageIds array required' });
        }

        // Verify product ownership
        const { data: product } = await supabaseAdmin.from('products').select('seller_id').eq('id', req.params.id).single();
        if (!product) return res.status(404).json({ error: 'Product not found' });
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', req.user.id).single();
        if (product.seller_id !== req.user.id && profile?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Update sort_order for each image
        for (let i = 0; i < imageIds.length; i++) {
            await supabaseAdmin.from('product_images').update({ sort_order: i }).eq('id', imageIds[i]);
        }

        // Also update product.image to the first image's URL
        const { data: primaryImg } = await supabaseAdmin.from('product_images')
            .select('url').eq('id', imageIds[0]).single();
        if (primaryImg) {
            await supabaseAdmin.from('products').update({ image: primaryImg.url }).eq('id', req.params.id);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/:id/images/:imageId — delete an image
router.delete('/:id/images/:imageId', requireAuth, async (req, res) => {
    try {
        const { data: product } = await supabaseAdmin.from('products').select('seller_id').eq('id', req.params.id).single();
        if (!product) return res.status(404).json({ error: 'Product not found' });
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', req.user.id).single();
        if (product.seller_id !== req.user.id && profile?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await supabaseAdmin.from('product_images').delete().eq('id', req.params.imageId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products/log/search — log a search query (no auth required)
router.post('/log/search', optionalAuth, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const { error } = await supabaseAdmin
            .from('search_logs')
            .insert({
                query: query.trim().toLowerCase(),
                user_id: req.user?.id || null,
                created_at: new Date().toISOString()
            });

        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        console.error('Search logging failed:', err.message);
        res.json({ success: true, warning: 'Log skipped' });
    }
});

// POST /api/products/log/browse — log a product view (no auth required)
router.post('/log/browse', optionalAuth, async (req, res) => {
    try {
        const { product_id, category_id } = req.body;
        if (!product_id) return res.status(400).json({ error: 'Product ID is required' });

        const { error } = await supabaseAdmin
            .from('browse_logs')
            .insert({
                product_id,
                category_id: category_id || null,
                user_id: req.user?.id || null,
                created_at: new Date().toISOString()
            });

        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        console.error('Browse logging failed:', err.message);
        res.json({ success: true, warning: 'Log skipped' });
    }
});

export default router;


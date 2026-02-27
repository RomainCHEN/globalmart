import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Middleware: require admin role
async function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();
    if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// GET /api/admin/stats — platform overview
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [usersRes, sellersRes, storesRes, productsRes, ordersRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
            supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('orders').select('total'),
        ]);

        const totalRevenue = (ordersRes.data || []).reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

        res.json({
            totalUsers: usersRes.count || 0,
            totalSellers: sellersRes.count || 0,
            totalStores: storesRes.count || 0,
            totalProducts: productsRes.count || 0,
            totalOrders: (ordersRes.data || []).length,
            totalRevenue: totalRevenue.toFixed(2),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/users — list all users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;
        let query = supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        if (role) {
            query = query.eq('role', role);
        }

        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json({ users: data, total: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'seller', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        // Prevent admin from downgrading themselves
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ role })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }
        // Delete from Supabase Auth (cascades to profiles via FK)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/orders — all orders
router.get('/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        let query = supabaseAdmin
            .from('orders')
            .select('*, order_items(*), profiles!orders_user_id_fkey(name, email)', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json({ orders: data, total: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/stores — all stores with details
router.get('/stores', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('stores')
            .select('*, profiles(name, email)')
            .order('created_at', { ascending: false });
        if (error) return res.status(400).json({ error: error.message });

        // Add product counts
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

// PATCH /api/admin/stores/:id/verify — toggle verified
router.patch('/stores/:id/verify', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { verified } = req.body;
        const { data, error } = await supabaseAdmin
            .from('stores')
            .update({ verified: !!verified })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/stores/:id
router.delete('/stores/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('stores').delete().eq('id', req.params.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/products/:id — admin delete any product
router.delete('/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/products — all products with seller info
router.get('/products', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        let query = supabaseAdmin
            .from('products')
            .select('*, categories(name), stores(name), profiles!products_seller_id_fkey(name, email)', { count: 'exact' })
            .order('created_at', { ascending: false });

        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json({ products: data, total: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

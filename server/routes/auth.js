import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Register (auto-confirms email via admin API)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Create user with admin API (auto-confirms email)
        const { data: adminData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: role || 'user' }
        });
        if (createError) return res.status(400).json({ error: createError.message });

        // Immediately sign them in so we return a session
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email, password
        });
        if (loginError) return res.status(400).json({ error: loginError.message });

        res.json({ user: loginData.user, session: loginData.session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error) return res.status(400).json({ error: error.message });
        res.json({ user: data.user, session: data.session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
    try {
        await supabaseAdmin.auth.admin.signOut(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();
        if (error) return res.status(404).json({ error: 'Profile not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile
router.put('/me', requireAuth, async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (avatar !== undefined) updates.avatar = avatar;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

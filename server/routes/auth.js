import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Register (auto-confirms email via admin API)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, shipping_address, birthday_month, birthday_day, contact_person, contact_phone, shop_name, shop_desc, shop_photo } = req.body;

        // Create user with admin API (auto-confirms email)
        const { data: adminData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { 
                name, 
                role: role || 'user',
                birthday_month,
                birthday_day,
                contact_person,
                contact_phone
            }
        });
        if (createError) return res.status(400).json({ error: createError.message });

        // Update profile with extra info (Auth trigger handles initial profile creation, 
        // but we need to ensure these specific fields are set)
        if (adminData.user) {
            const profileUpdates = {
                name,
                role: role || 'user',
                birthday_month,
                birthday_day,
                contact_person,
                contact_phone,
                shipping_address: shipping_address || null
            };
            
            await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', adminData.user.id);
        }

        // Create store for sellers during registration
        if (role === 'seller' && adminData.user) {
            const { error: storeError } = await supabaseAdmin
                .from('stores')
                .insert({
                    seller_id: adminData.user.id,
                    name: shop_name || `${name}'s Shop`,
                    description: shop_desc || '',
                    shop_photo: shop_photo || ''
                });
            if (storeError) {
                console.error('Failed to create store during registration:', storeError.message);
            }
        }

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
        if (error) return res.status(401).json({ error: error.message });

        // A21: Birthday check and notification
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profile && profile.birthday_month && profile.birthday_day) {
            const now = new Date();
            // Using local time of the server/database for the check
            if (profile.birthday_month === (now.getMonth() + 1) && profile.birthday_day === now.getDate()) {
                // Check if notification already sent today to avoid spamming
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const { data: existingNotif } = await supabaseAdmin
                    .from('notifications')
                    .select('id')
                    .eq('user_id', profile.id)
                    .eq('type', 'birthday_reminder')
                    .gte('created_at', todayStart.toISOString())
                    .limit(1);

                if (!existingNotif || existingNotif.length === 0) {
                    await supabaseAdmin.from('notifications').insert({
                        user_id: profile.id,
                        type: 'birthday_reminder',
                        title: 'Happy Birthday! 🎂',
                        message: 'Enjoy a special 10% discount on all items in your wishlist today ONLY!',
                        link: '/dashboard?tab=wishlist'
                    });
                }
            }
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Refresh token — get new access_token using refresh_token
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) return res.status(400).json({ error: 'refresh_token is required' });

        const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
        if (error || !data.session) {
            return res.status(401).json({ error: error?.message || 'Failed to refresh session' });
        }

        res.json({ session: data.session });
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
        const { name, avatar, shipping_address, contact_person, contact_phone } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (avatar !== undefined) updates.avatar = avatar;
        if (shipping_address !== undefined) updates.shipping_address = shipping_address;
        if (contact_person !== undefined) updates.contact_person = contact_person;
        if (contact_phone !== undefined) updates.contact_phone = contact_phone;

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

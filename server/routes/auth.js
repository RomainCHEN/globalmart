import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Register (auto-confirms email via admin API)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, shipping_address, birthday_month, birthday_day, contact_person, contact_phone, shop_name, shop_desc, shop_photo } = req.body;

        console.log(`Starting registration for ${email} with role ${role}`);

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
                contact_phone,
                shop_name,
                shop_desc,
                shop_photo
            }
        });
        if (createError) {
            console.error('Registration failed at createUser:', createError.message);
            return res.status(400).json({ error: createError.message });
        }

        if (!adminData.user) {
            return res.status(500).json({ error: 'User creation failed - no user returned' });
        }

        const userId = adminData.user.id;

        // Ensure profile exists and is updated. 
        // We use upsert here to be safe: if the trigger already created it, we update;
        // if the trigger is slow, we create it now. This prevents FK errors when creating the store.
        const profileData = {
            id: userId,
            email,
            name,
            role: role || 'user',
            birthday_month,
            birthday_day,
            contact_person,
            contact_phone,
            shipping_address: shipping_address || null
        };
        
        console.log(`Ensuring profile exists for ${userId}`);
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(profileData);
        
        if (profileError) {
            console.error('Failed to upsert profile during registration:', profileError.message);
            // We continue anyway, but this is a red flag.
        }

        // Create store for sellers during registration
        if (role === 'seller') {
            console.log(`Creating store for seller ${userId}: ${shop_name}`);
            
            const storePayload = {
                seller_id: userId,
                name: shop_name || `${name}'s Shop`,
                description: shop_desc || '',
                is_online: false
            };

            // Try to include shop_photo, but fallback if the column doesn't exist
            let { data: storeData, error: storeError } = await supabaseAdmin
                .from('stores')
                .insert({ ...storePayload, shop_photo: shop_photo || '' })
                .select()
                .single();

            if (storeError && (storeError.message.includes("shop_photo") || storeError.code === '42703')) {
                console.warn('Fallback: shop_photo column missing, retrying without it');
                const retry = await supabaseAdmin
                    .from('stores')
                    .insert(storePayload)
                    .select()
                    .single();
                storeData = retry.data;
                storeError = retry.error;
            }

            if (storeError) {
                console.error('Failed to create store during registration:', storeError.message);
                // Return a specific error if store creation fails so user knows account exists but store failed
                return res.status(400).json({ error: `User created but store creation failed: ${storeError.message}` });
            }
            console.log('Store created successfully:', storeData.id);
        }

        // Immediately sign them in so we return a session
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email, password
        });
        if (loginError) {
            console.error('Registration successful but initial login failed:', loginError.message);
            return res.status(400).json({ error: `Registration successful but login failed: ${loginError.message}` });
        }

        res.json({ user: loginData.user, session: loginData.session });
    } catch (err) {
        console.error('Unexpected error during registration:', err.message);
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
                        message: 'Enjoy exclusive birthday discounts on selected items in your wishlist today ONLY!',
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
        const { name, avatar, shipping_address, contact_person, contact_phone, birthday_month, birthday_day } = req.body;
        
        // Fetch current profile to check if birthday is already set
        const { data: currentProfile } = await supabaseAdmin
            .from('profiles')
            .select('birthday_month, birthday_day')
            .eq('id', req.user.id)
            .single();

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (avatar !== undefined) updates.avatar = avatar;
        if (shipping_address !== undefined) updates.shipping_address = shipping_address;
        if (contact_person !== undefined) updates.contact_person = contact_person;
        if (contact_phone !== undefined) updates.contact_phone = contact_phone;

        // Strict Birthday Locking Logic
        // Robustly check for demo account using the fresh profile data
        const { data: profileForEmail } = await supabaseAdmin.from('profiles').select('email').eq('id', req.user.id).single();
        const userEmail = profileForEmail?.email || '';
        const isDemoAccount = userEmail === 'demo@globalmart.com';
        
        const hasExistingBirthday = currentProfile?.birthday_month && currentProfile?.birthday_day;
        
        if (birthday_month !== undefined || birthday_day !== undefined) {
            if (hasExistingBirthday && !isDemoAccount) {
                // Check if they are actually trying to change it (not just resending same values)
                const isChangingMonth = birthday_month !== undefined && parseInt(birthday_month) !== currentProfile.birthday_month;
                const isChangingDay = birthday_day !== undefined && parseInt(birthday_day) !== currentProfile.birthday_day;
                
                if (isChangingMonth || isChangingDay) {
                    return res.status(403).json({ 
                        error: 'Birthday information is locked and cannot be changed after initial setting to prevent discount abuse.' 
                    });
                }
            } else {
                // If not set yet OR is demo account, allow setting/updating both
                if (birthday_month !== undefined) updates.birthday_month = parseInt(birthday_month);
                if (birthday_day !== undefined) updates.birthday_day = parseInt(birthday_day);
            }
        }

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

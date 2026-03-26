import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// POST /api/migrate — migrate and complete missing data
router.post('/', async (req, res) => {
    try {
        // 1. Update profiles with random birthdays
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, name, role, birthday_month');
        
        if (profileError) return res.status(400).json({ error: profileError.message });

        const profileUpdates = profiles.map(p => {
            const updates = {};
            if (!p.birthday_month) {
                updates.birthday_month = Math.floor(Math.random() * 12) + 1;
                updates.birthday_day = Math.floor(Math.random() * 28) + 1;
            }
            if (p.role === 'seller') {
                updates.contact_person = p.name || 'Person in Charge';
                updates.contact_phone = '+852 ' + Math.floor(10000000 + Math.random() * 90000000);
            }
            return { id: p.id, ...updates };
        }).filter(u => Object.keys(u).length > 1);

        for (const update of profileUpdates) {
            const id = update.id;
            delete update.id;
            await supabaseAdmin.from('profiles').update(update).eq('id', id);
        }

        // 2. Update stores with shop_photo
        const { data: stores, error: storeError } = await supabaseAdmin
            .from('stores')
            .select('id, logo, shop_photo');
        
        if (storeError) return res.status(400).json({ error: storeError.message });

        const storeUpdates = stores.map(s => {
            if (!s.shop_photo) {
                // Use a default shop photo based on logo or generic
                return { id: s.id, shop_photo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80' };
            }
            return null;
        }).filter(Boolean);

        for (const update of storeUpdates) {
            const id = update.id;
            delete update.id;
            await supabaseAdmin.from('stores').update(update).eq('id', id);
        }

        res.json({
            message: 'Migration completed',
            profilesUpdated: profileUpdates.length,
            storesUpdated: storeUpdates.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/wishlist
router.get('/', requireAuth, async (req, res) => {
    try {
        const { month, day } = req.query;
        
        // 1. Get user profile for birthday check
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('birthday_month, birthday_day')
            .eq('id', req.user.id)
            .single();

        // Use client-sent month/day (device date) or fallback to server date
        let checkMonth = month ? parseInt(month) : 0;
        let checkDay = day ? parseInt(day) : 0;
        
        if (!checkMonth || !checkDay) {
            const now = new Date();
            checkMonth = now.getMonth() + 1;
            checkDay = now.getDate();
        }

        const isBirthday = !!(profile && 
                           profile.birthday_month === checkMonth && 
                           profile.birthday_day === checkDay);

        // 2. Get wishlist items
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select('*, products(*, categories(name, slug))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });

        // 3. Anti-Abuse Checks for Birthday Promotion
        let abusePrevented = false;
        let isEligible = false;
        let finalIsBirthday = isBirthday;

        if (isBirthday) {
            // Robustly check for demo account by ID
            const { data: profileData } = await supabaseAdmin.from('profiles').select('email').eq('id', req.user.id).single();
            const userEmail = profileData?.email || '';
            const isDemoAccount = userEmail === 'demo@globalmart.com';

            // Check A: Account Age (Must be > 30 days old)
            const accountAgeDays = (new Date().getTime() - new Date(req.user.created_at || new Date()).getTime()) / (1000 * 3600 * 24);
            const isMatureAccount = isDemoAccount || (accountAgeDays >= 30);

            // Check B: Purchase History (Must have at least 1 delivered order)
            let hasPurchaseHistory = isDemoAccount;
            if (!isDemoAccount) {
                const { count: deliveredOrderCount } = await supabaseAdmin
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', req.user.id)
                    .eq('status', 'delivered');
                hasPurchaseHistory = (deliveredOrderCount || 0) > 0;
            }

            isEligible = isMatureAccount && hasPurchaseHistory;
            
            if (!isEligible) {
                abusePrevented = true;
                finalIsBirthday = false; // Hide discount tags from UI
            }
        }

        // 4. Apply discount only if they are truly eligible
        if (isEligible && data) {
            data.forEach(item => {
                const p = item.products;
                if (p && p.is_birthday_promo_enabled) {
                    const discountPercent = p.birthday_promo_discount || 10;
                    if (!p.original_price) p.original_price = p.price;
                    p.price = Math.round(p.price * (1 - discountPercent / 100) * 100) / 100;
                    item.is_birthday_discount = true;
                    item.birthday_discount_percent = discountPercent;
                }
            });
        }

        res.json({ data: data || [], isBirthday: finalIsBirthday, abuse_prevented: abusePrevented });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/wishlist — add to wishlist
router.post('/', requireAuth, async (req, res) => {
    try {
        const { product_id } = req.body;
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .insert({ user_id: req.user.id, product_id })
            .select()
            .single();
        if (error) {
            if (error.code === '23505') {
                return res.status(200).json({ message: 'Already in wishlist' });
            }
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', requireAuth, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('wishlists')
            .delete()
            .eq('user_id', req.user.id)
            .eq('product_id', req.params.productId);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

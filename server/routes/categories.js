import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .order('name');
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

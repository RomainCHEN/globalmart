import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/migrate/bilingual — add name_zh and description_zh columns to products AND stores
router.post('/bilingual', async (req, res) => {
    try {
        const results = { products: 'unknown', stores: 'unknown', orders: 'unknown' };

        // Check products table
        const prodTest = await supabaseAdmin
            .from('products')
            .select('name_zh, description_zh')
            .limit(1);
        if (prodTest.error && prodTest.error.message.includes('does not exist')) {
            results.products = 'missing — run SQL below';
        } else {
            results.products = 'ready';
        }

        // Check stores table
        const storeTest = await supabaseAdmin
            .from('stores')
            .select('name_zh, description_zh')
            .limit(1);
        if (storeTest.error && storeTest.error.message.includes('does not exist')) {
            results.stores = 'missing — run SQL below';
        } else {
            results.stores = 'ready';
        }

        // Check orders table for store_id
        const orderTest = await supabaseAdmin
            .from('orders')
            .select('store_id')
            .limit(1);
        if (orderTest.error && orderTest.error.message.includes('column "store_id" does not exist')) {
            results.orders = 'missing — run SQL below';
        } else {
            results.orders = 'ready';
        }

        const allReady = results.products === 'ready' && results.stores === 'ready' && results.orders === 'ready';
        if (allReady) {
            return res.json({ success: true, message: 'All schema updates ready', results });
        }

        res.status(400).json({
            error: 'Some columns missing. Run this SQL in Supabase SQL Editor:',
            results,
            sql: [
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS name_zh TEXT DEFAULT '';",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS description_zh TEXT DEFAULT '';",
                "ALTER TABLE stores ADD COLUMN IF NOT EXISTS name_zh TEXT DEFAULT '';",
                "ALTER TABLE stores ADD COLUMN IF NOT EXISTS description_zh TEXT DEFAULT '';",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;"
            ]
        });
    } catch (err) {
        res.status(500).json({
            error: err.message,
            sql: [
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS name_zh TEXT DEFAULT '';",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS description_zh TEXT DEFAULT '';",
                "ALTER TABLE stores ADD COLUMN IF NOT EXISTS name_zh TEXT DEFAULT '';",
                "ALTER TABLE stores ADD COLUMN IF NOT EXISTS description_zh TEXT DEFAULT '';",
                "ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;"
            ]
        });
    }
});

export default router;

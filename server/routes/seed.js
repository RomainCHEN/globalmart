import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

// POST /api/seed — populate database with demo data
router.post('/', async (req, res) => {
    try {
        // 1. Create categories
        const categoryData = [
            { name: 'Sports & Outdoors', slug: 'sports', icon: 'sports_tennis' },
            { name: 'Electronics', slug: 'electronics', icon: 'devices' },
            { name: 'Home & Kitchen', slug: 'home', icon: 'home' },
            { name: 'Fashion', slug: 'fashion', icon: 'checkroom' },
            { name: 'Books & Media', slug: 'books', icon: 'menu_book' },
            { name: 'Health & Beauty', slug: 'health', icon: 'spa' },
        ];

        const { data: categories, error: catErr } = await supabaseAdmin
            .from('categories')
            .upsert(categoryData, { onConflict: 'slug' })
            .select();
        if (catErr) return res.status(400).json({ error: catErr.message });

        const catMap = {};
        categories.forEach(c => { catMap[c.slug] = c.id; });

        // 2. Create demo seller profiles (using admin API)
        const sellerAccounts = [
            { email: 'sportspro@globalmart.com', password: 'Seller123456', name: 'SportsPro Official', role: 'seller' },
            { email: 'techzone@globalmart.com', password: 'Seller123456', name: 'TechZone Digital', role: 'seller' },
            { email: 'homelife@globalmart.com', password: 'Seller123456', name: 'HomeLife Essentials', role: 'seller' },
            { email: 'urbanstyle@globalmart.com', password: 'Seller123456', name: 'Urban Style Co.', role: 'seller' },
        ];

        const sellerIds = [];
        for (const seller of sellerAccounts) {
            // Try to create, or find if already exists
            let userId;
            const { data: existing } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', seller.email)
                .single();

            if (existing) {
                userId = existing.id;
            } else {
                const { data: newUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
                    email: seller.email,
                    password: seller.password,
                    email_confirm: true,
                    user_metadata: { name: seller.name, role: seller.role }
                });
                if (userErr) {
                    console.log(`Seller ${seller.email} creation skipped: ${userErr.message}`);
                    continue;
                }
                userId = newUser.user.id;
            }
            sellerIds.push({ id: userId, name: seller.name });
        }

        // 3. Create stores for each seller
        const storeData = [
            { seller_id: sellerIds[0]?.id, name: 'SportsPro Official Store', name_zh: '运动达人官方旗舰店', description: 'Premium sports equipment and athletic gear from top brands worldwide. Authorized dealer for Yonex, Li-Ning, and Victor.', description_zh: '全球顶级运动装备与专业体育用品。尤尼克斯、李宁、威克多授权经销商，为运动爱好者提供最优质的专业装备。', logo: '🏸', banner: '', verified: true, rating: 4.8 },
            { seller_id: sellerIds[1]?.id, name: 'TechZone Digital', name_zh: '科技区数码', description: 'Cutting-edge electronics and gadgets. From smartwatches to headphones, we bring you the latest in tech innovation.', description_zh: '前沿电子产品与数码潮品。从智能手表到耳机，为您带来最新科技创新。', logo: '💻', banner: '', verified: true, rating: 4.7 },
            { seller_id: sellerIds[2]?.id, name: 'HomeLife Essentials', name_zh: '宜居生活家居馆', description: 'Curated home and kitchen products that blend functionality with beautiful design. Make your house a home.', description_zh: '精选家居与厨房用品，将实用功能与精美设计完美融合。让您的房子成为温馨的家。', logo: '🏠', banner: '', verified: false, rating: 4.6 },
            { seller_id: sellerIds[3]?.id, name: 'Urban Style Co.', name_zh: '都市风尚潮品店', description: 'Street-inspired fashion and lifestyle accessories. Premium quality for the modern urbanite.', description_zh: '街头风格时尚服饰与生活配件。为都市潮人打造的高品质穿搭选择。', logo: '👟', banner: '', verified: true, rating: 4.9 },
        ].filter(s => s.seller_id);

        // Delete old stores first
        for (const sd of storeData) {
            await supabaseAdmin.from('stores').delete().eq('seller_id', sd.seller_id);
        }

        const { data: stores, error: storeErr } = await supabaseAdmin
            .from('stores')
            .insert(storeData)
            .select();

        if (storeErr) {
            console.log('Store creation error:', storeErr.message);
            // Continue even if stores fail — products can exist without stores
        }

        const storeMap = {};
        if (stores) {
            stores.forEach(s => { storeMap[s.seller_id] = s.id; });
        }

        // 4. Create products
        const products = [
            // Sports & Outdoors (SportsPro)
            { name: 'Yonex Astrox 99 Pro', description: 'Built for absolute dominance. The choice of champions.', price: 210.00, original_price: 240.00, rating: 4.8, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/yonex_astrox_99_1772210188095.png', tags: ['HOT', 'POWER'], specs: { Weight: '3U', Balance: 'Head Heavy', Flex: 'Stiff' }, stock: 25 },
            { name: 'Li-Ning Tectonic 9', description: 'Engineered for light-speed response and deadly defense.', price: 185.00, rating: 5.0, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/lining_tectonic_9_1772210202781.png', tags: ['NEW', 'SPEED'], specs: { Weight: '4U', Balance: 'Even', Flex: 'Medium' }, stock: 30 },
            { name: 'Victor Thruster K Ryuga II', description: 'Enhanced stability for pinpoint smash precision.', price: 199.00, original_price: 220.00, rating: 4.5, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/victor_thruster_racket_1772210216303.png', tags: ['CONTROL'], specs: { Weight: '3U', Balance: 'Head Heavy', Flex: 'Stiff' }, stock: 15 },
            { name: 'ThunderStrike PRO 9000', description: 'Engineered for the aggressive player. High-modulus graphite construction.', price: 129.00, original_price: 189.00, rating: 5.0, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/thunderstrike_racket_1772210252816.png', tags: ['SALE'], specs: { Weight: '3U / 4U', Balance: 'Head Heavy', Flex: 'Stiff' }, stock: 40 },
            { name: 'Pro Running Shoes X1', description: 'Ultra-lightweight marathon runners with carbon plate technology.', price: 169.00, original_price: 199.00, rating: 4.6, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/running_shoes_1772210267041.png', tags: ['HOT'], stock: 50 },

            // Electronics (TechZone)
            { name: 'Wireless Noise Cancelling Headphones', name_zh: '无线降噪耳机', description: 'Immersive sound with active noise cancellation and 30-hour battery.', description_zh: '沉浸式音质，配备主动降噪技术，续航30小时。', price: 299.00, rating: 4.7, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/noise_cancelling_headphones_1772210280587.png', tags: ['NEW'], specs: { Battery: '30 Hours', 'Noise Cancel': 'Adaptive ANC', Connection: 'BT 5.3' }, stock: 100 },
            { name: 'Smart Watch Ultra', name_zh: '智能手表 Ultra', description: 'Advanced health tracking with ECG, SpO2, and GPS. Titanium body.', description_zh: '先进健康监测，支持心电图、血氧、GPS。钛合金机身。', price: 449.00, original_price: 499.00, rating: 4.9, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/smart_watch_ultra_1772210320036.png', tags: ['HOT', 'PREMIUM'], specs: { Display: 'AMOLED 1.9"', Battery: '72 Hours', Water: '100m' }, stock: 35 },
            { name: 'Portable Bluetooth Speaker', description: 'Thunderous 360° sound in a pocket-sized waterproof design.', price: 79.00, rating: 4.4, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/bluetooth_speaker_1772210333103.png', tags: ['SALE'], stock: 200 },
            { name: 'Wireless Charging Pad Pro', description: 'Fast 15W Qi charging with alignment magnets. Works through cases.', price: 49.00, original_price: 69.00, rating: 4.3, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], tags: ['NEW'], stock: 150, image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/wireless_charging_pad_1772210346225.png' },

            // Home & Kitchen (HomeLife)
            { name: 'Pour-Over Coffee Maker Set', description: 'Barista-grade pour-over set with gooseneck kettle and filter stand.', price: 89.00, rating: 4.8, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/pour_over_coffee_1772210373188.png', tags: ['HOT'], stock: 60 },
            { name: 'Minimalist Desk Lamp', description: 'Adjustable LED desk lamp with wireless charging base and USB-C port.', price: 65.00, original_price: 85.00, rating: 4.5, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/minimalist_desk_lamp_1772210387054.png', tags: ['SALE'], stock: 80 },
            { name: 'Digital Kitchen Scale', description: 'Precision 0.1g digital scale with tare function and backlit display.', price: 29.90, rating: 4.6, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/kitchen_scale_1772210404133.png', tags: ['NEW'], stock: 120 },
            { name: 'Cast Iron Dutch Oven', description: '6-quart enameled cast iron with self-basting lid. Perfect roasts every time.', price: 119.00, original_price: 159.00, rating: 4.9, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/dutch_oven_1772210419481.png', tags: ['PREMIUM'], stock: 45 },

            // Fashion (Urban Style)
            { name: 'Urban Street Sneakers', description: 'Premium leather sneakers with memory foam insoles and platform sole.', price: 139.00, rating: 4.7, category_id: catMap['fashion'], seller_id: sellerIds[3]?.id, store_id: storeMap[sellerIds[3]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/urban_sneakers_1772210463509.png', tags: ['HOT'], stock: 70 },
            { name: 'Tech Travel Backpack', description: 'Water-resistant 25L backpack with laptop sleeve and hidden pockets.', price: 89.00, original_price: 119.00, rating: 4.8, category_id: catMap['fashion'], seller_id: sellerIds[3]?.id, store_id: storeMap[sellerIds[3]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/travel_backpack_1772210477374.png', tags: ['SALE'], stock: 90 },
            { name: 'Polarized Aviator Sunglasses', description: 'UV400 polarized lenses with titanium frame. Comes with hard case.', price: 159.00, rating: 4.6, category_id: catMap['fashion'], seller_id: sellerIds[3]?.id, store_id: storeMap[sellerIds[3]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/aviator_sunglasses_1772210489103.png', tags: ['PREMIUM'], stock: 55 },

            // Books & Media (HomeLife doubles as books seller)
            { name: 'The Art of Clean Code', description: 'Essential guide to writing maintainable, elegant software. 2024 Edition.', price: 34.99, rating: 4.9, category_id: catMap['books'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/clean_code_book_1772210525687.png', tags: ['NEW'], stock: 300 },
            { name: 'Mindful Productivity Journal', description: 'Undated 90-day planner with habit tracker, goal setting, and reflection pages.', price: 24.99, original_price: 29.99, rating: 4.7, category_id: catMap['books'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80', tags: ['SALE'], stock: 200 },

            // Health & Beauty (TechZone doubles as health seller)
            { name: 'Premium Skincare Set', description: 'Complete daily routine: cleanser, serum, moisturizer, and SPF. Dermatologist tested.', price: 89.00, original_price: 120.00, rating: 4.8, category_id: catMap['health'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', tags: ['HOT', 'PREMIUM'], stock: 75 },
            { name: 'Sonic Electric Toothbrush', description: '40,000 strokes/min with 5 modes, smart timer, and 6-month battery.', price: 59.00, rating: 4.5, category_id: catMap['health'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://images.unsplash.com/photo-1559671621-feba8d26cbf5?w=800&q=80', tags: ['NEW'], stock: 130 },
            { name: 'Yoga Mat Premium', description: 'Extra thick 6mm non-slip mat with alignment lines and carrying strap.', price: 45.00, original_price: 65.00, rating: 4.6, category_id: catMap['health'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80', tags: ['SALE'], stock: 100 },
        ];

        // Delete old products and insert fresh ones
        await supabaseAdmin.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const { data: insertedProducts, error: prodErr } = await supabaseAdmin
            .from('products')
            .insert(products)
            .select();

        if (prodErr) return res.status(400).json({ error: prodErr.message });

        res.json({
            message: 'Database seeded successfully!',
            categories: categories.length,
            stores: stores?.length || 0,
            products: insertedProducts.length,
            sellers: sellerIds.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

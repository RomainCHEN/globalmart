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
            { 
                name: 'Yonex Astrox 99 Pro', 
                name_zh: '尤尼克斯 Astrox 99 Pro',
                description: 'Built for absolute dominance. The choice of champions.', 
                description_zh: '为绝对统治力而生。冠军之选。',
                price: 210.00, original_price: 240.00, rating: 4.8, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/yonex_astrox_99_1772210188095.png', tags: ['HOT', 'POWER'], specs: { Weight: '3U', Balance: 'Head Heavy', Flex: 'Stiff' }, stock: 25 
            },
            { 
                name: 'Li-Ning Tectonic 9', 
                name_zh: '李宁 雷霆 9',
                description: 'Engineered for light-speed response and deadly defense.', 
                description_zh: '为光速响应和致命防守而设计。',
                price: 185.00, rating: 5.0, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/lining_tectonic_9_1772210202781.png', tags: ['NEW', 'SPEED'], specs: { Weight: '4U', Balance: 'Even', Flex: 'Medium' }, stock: 30 
            },
            { 
                name: 'Victor Thruster K Ryuga II', 
                name_zh: '威克多 隼 K Ryuga II',
                description: 'Enhanced stability for pinpoint smash precision.', 
                description_zh: '增强稳定性，实现精准扣杀。',
                price: 199.00, original_price: 220.00, rating: 4.5, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/victor_thruster_racket_1772210216303.png', tags: ['CONTROL'], specs: { Weight: '3U', Balance: 'Head Heavy', Flex: 'Stiff' }, stock: 15 
            },
            { 
                name: 'ThunderStrike PRO 9000', 
                name_zh: '雷击 PRO 9000',
                description: 'Engineered for the aggressive player. High-modulus graphite construction.', 
                description_zh: '为进攻型选手设计。采用高模量石墨结构。',
                price: 129.00, original_price: 189.00, rating: 5.0, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/thunderstrike_racket_1772210252816.png', tags: ['SALE'], specs: { Weight: '3U / 4U', Balance: 'Head Heavy', Flex: 'Stiff' }, stock: 40 
            },
            { 
                name: 'Pro Running Shoes X1', 
                name_zh: '专业跑步鞋 X1',
                description: 'Ultra-lightweight marathon runners with carbon plate technology.', 
                description_zh: '超轻马拉松跑鞋，搭载碳板技术。',
                price: 169.00, original_price: 199.00, rating: 4.6, category_id: catMap['sports'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/running_shoes_1772210267041.png', tags: ['HOT'], stock: 50 
            },

            // Electronics (TechZone)
            { name: 'Wireless Noise Cancelling Headphones', name_zh: '无线降噪耳机', description: 'Immersive sound with active noise cancellation and 30-hour battery.', description_zh: '沉浸式音质，配备主动降噪技术，续航30小时。', price: 299.00, rating: 4.7, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/noise_cancelling_headphones_1772210280587.png', tags: ['NEW'], specs: { Battery: '30 Hours', 'Noise Cancel': 'Adaptive ANC', Connection: 'BT 5.3' }, stock: 100 },
            { name: 'Smart Watch Ultra', name_zh: '智能手表 Ultra', description: 'Advanced health tracking with ECG, SpO2, and GPS. Titanium body.', description_zh: '先进健康监测，支持心电图、血氧、GPS。钛合金机身。', price: 449.00, original_price: 499.00, rating: 4.9, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/smart_watch_ultra_1772210320036.png', tags: ['HOT', 'PREMIUM'], specs: { Display: 'AMOLED 1.9"', Battery: '72 Hours', Water: '100m' }, stock: 35 },
            { 
                name: 'Portable Bluetooth Speaker', 
                name_zh: '便携式蓝牙音箱',
                description: 'Thunderous 360° sound in a pocket-sized waterproof design.', 
                description_zh: '口袋大小的防水设计，带来震撼的 360° 环绕声。',
                price: 79.00, rating: 4.4, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/bluetooth_speaker_1772210333103.png', tags: ['SALE'], stock: 200 
            },
            { 
                name: 'Wireless Charging Pad Pro', 
                name_zh: '无线充电板 Pro',
                description: 'Fast 15W Qi charging with alignment magnets. Works through cases.', 
                description_zh: '15W 快速 Qi 充电，配备磁吸对齐。带壳也能充。',
                price: 49.00, original_price: 69.00, rating: 4.3, category_id: catMap['electronics'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], tags: ['NEW'], stock: 150, image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/wireless_charging_pad_1772210346225.png' 
            },

            // Home & Kitchen (HomeLife)
            { 
                name: 'Pour-Over Coffee Maker Set', 
                name_zh: '手冲咖啡壶套装',
                description: 'Barista-grade pour-over set with gooseneck kettle and filter stand.', 
                description_zh: '咖啡师级手冲套装，包含细口壶和滤杯架。',
                price: 89.00, rating: 4.8, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/pour_over_coffee_1772210373188.png', tags: ['HOT'], stock: 60 
            },
            { 
                name: 'Minimalist Desk Lamp', 
                name_zh: '简约台灯',
                description: 'Adjustable LED desk lamp with wireless charging base and USB-C port.', 
                description_zh: '可调节 LED 台灯，带无线充电底座和 USB-C 端口。',
                price: 65.00, original_price: 85.00, rating: 4.5, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/minimalist_desk_lamp_1772210387054.png', tags: ['SALE'], stock: 80 
            },
            { 
                name: 'Digital Kitchen Scale', 
                name_zh: '数字厨房秤',
                description: 'Precision 0.1g digital scale with tare function and backlit display.', 
                description_zh: '0.1g 精准数字秤，带去皮功能和背光显示屏。',
                price: 29.90, rating: 4.6, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/kitchen_scale_1772210404133.png', tags: ['NEW'], stock: 120 
            },
            { 
                name: 'Cast Iron Dutch Oven', 
                name_zh: '铸铁荷兰锅',
                description: '6-quart enameled cast iron with self-basting lid. Perfect roasts every time.', 
                description_zh: '6 夸脱搪瓷铸铁锅，带自循环水滴盖。每次都能做出完美的烤肉。',
                price: 119.00, original_price: 159.00, rating: 4.9, category_id: catMap['home'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/dutch_oven_1772210419481.png', tags: ['PREMIUM'], stock: 45 
            },

            // Fashion (Urban Style)
            { 
                name: 'Urban Street Sneakers', 
                name_zh: '都市街头运动鞋',
                description: 'Premium leather sneakers with memory foam insoles and platform sole.', 
                description_zh: '高品质皮革运动鞋，配有记忆海绵鞋垫和厚底。',
                price: 139.00, rating: 4.7, category_id: catMap['fashion'], seller_id: sellerIds[3]?.id, store_id: storeMap[sellerIds[3]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/urban_sneakers_1772210463509.png', tags: ['HOT'], stock: 70 
            },
            { 
                name: 'Tech Travel Backpack', 
                name_zh: '科技旅行背包',
                description: 'Water-resistant 25L backpack with laptop sleeve and hidden pockets.', 
                description_zh: '防水 25L 背包，带笔记本电脑隔层和隐藏口袋。',
                price: 89.00, original_price: 119.00, rating: 4.8, category_id: catMap['fashion'], seller_id: sellerIds[3]?.id, store_id: storeMap[sellerIds[3]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/travel_backpack_1772210477374.png', tags: ['SALE'], stock: 90 
            },
            { 
                name: 'Polarized Aviator Sunglasses', 
                name_zh: '偏光飞行员墨镜',
                description: 'UV400 polarized lenses with titanium frame. Comes with hard case.', 
                description_zh: 'UV400 偏光镜片，钛合金镜框。附赠硬盒。',
                price: 159.00, rating: 4.6, category_id: catMap['fashion'], seller_id: sellerIds[3]?.id, store_id: storeMap[sellerIds[3]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/aviator_sunglasses_1772210489103.png', tags: ['PREMIUM'], stock: 55 
            },

            // Books & Media (HomeLife doubles as books seller)
            { 
                name: 'The Art of Clean Code', 
                name_zh: '代码整洁之道',
                description: 'Essential guide to writing maintainable, elegant software. 2024 Edition.', 
                description_zh: '编写可维护、优雅软件的必备指南。2024 版。',
                price: 34.99, rating: 4.9, category_id: catMap['books'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://ebxrqeyulpjjjcbmbpdn.supabase.co/storage/v1/object/public/product-images/products/clean_code_book_1772210525687.png', tags: ['NEW'], stock: 300 
            },
            { 
                name: 'Mindful Productivity Journal', 
                name_zh: '正念高效手账',
                description: 'Undated 90-day planner with habit tracker, goal setting, and reflection pages.', 
                description_zh: '无日期 90 天计划本，包含习惯追踪、目标设定和反思页。',
                price: 24.99, original_price: 29.99, rating: 4.7, category_id: catMap['books'], seller_id: sellerIds[2]?.id, store_id: storeMap[sellerIds[2]?.id], image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80', tags: ['SALE'], stock: 200 
            },

            // Health & Beauty (TechZone doubles as health seller)
            { 
                name: 'Premium Skincare Set', 
                name_zh: '高端护肤套装',
                description: 'Complete daily routine: cleanser, serum, moisturizer, and SPF. Dermatologist tested.', 
                description_zh: '完整的日常护肤方案：洁面、精华、保湿和防晒。经皮肤科医生测试。',
                price: 89.00, original_price: 120.00, rating: 4.8, category_id: catMap['health'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80', tags: ['HOT', 'PREMIUM'], stock: 75 
            },
            { 
                name: 'Sonic Electric Toothbrush', 
                name_zh: '声波电动牙刷',
                description: '40,000 strokes/min with 5 modes, smart timer, and 6-month battery.', 
                description_zh: '40,000 次/分钟震动，5 种模式，智能定时，续航长达 6 个月。',
                price: 59.00, rating: 4.5, category_id: catMap['health'], seller_id: sellerIds[1]?.id, store_id: storeMap[sellerIds[1]?.id], image: 'https://images.unsplash.com/photo-1559671621-feba8d26cbf5?w=800&q=80', tags: ['NEW'], stock: 130 
            },
            { 
                name: 'Yoga Mat Premium', 
                name_zh: '高端瑜伽垫',
                description: 'Extra thick 6mm non-slip mat with alignment lines and carrying strap.', 
                description_zh: '6mm 加厚防滑垫，带体式引导线和收纳背带。',
                price: 45.00, original_price: 65.00, rating: 4.6, category_id: catMap['health'], seller_id: sellerIds[0]?.id, store_id: storeMap[sellerIds[0]?.id], image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80', tags: ['SALE'], stock: 100 
            },
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

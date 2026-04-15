import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../server/routes/auth.js';
import productRoutes from '../server/routes/products.js';
import categoryRoutes from '../server/routes/categories.js';
import orderRoutes from '../server/routes/orders.js';
import reviewRoutes from '../server/routes/reviews.js';
import wishlistRoutes from '../server/routes/wishlist.js';
import storeRoutes from '../server/routes/stores.js';
import adminRoutes from '../server/routes/admin.js';
import translateRoutes from '../server/routes/translate.js';
import migrateRoutes from '../server/routes/migrate.js';
import seedRoutes from '../server/routes/seed.js';
import uploadRoutes from '../server/routes/upload.js';
import cartRoutes from '../server/routes/cart.js';

dotenv.config({ path: '.env.local' });

const app = express();

// CORS — allow all origins in production (Vercel handles domain security)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '6mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;

// Disable Vercel's built-in body parser so multer can handle multipart/form-data uploads
export const config = {
    api: {
        bodyParser: false,
    },
};


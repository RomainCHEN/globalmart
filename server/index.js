import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import storeRoutes from './routes/stores.js';
import adminRoutes from './routes/admin.js';
import translateRoutes from './routes/translate.js';
import migrateRoutes from './routes/migrate.js';
import seedRoutes from './routes/seed.js';
import uploadRoutes from './routes/upload.js';
import cartRoutes from './routes/cart.js';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`GlobalMart API server running on http://localhost:${PORT}`);
});

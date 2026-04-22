const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const pool = require('./db.js');
const ensureTrackingColumns = require('./ensureTrackingColumns.js');
const { migrateCoupons } = require('./migrate-coupons.js');
const addCouponDiscountColumns = require('./migrate-coupon-discount.js');
const adminRoutes = require('./routes/admin.js');
const productRoutes = require('./routes/products.js');
const orderRoutes = require('./routes/orderRoutes.js');
const enquiryRoutes = require('./routes/enquiryRoutes.js');
const galleryRoutes = require('./routes/galleryRoutes.js');
const couponRoutes = require('./routes/couponRoutes.js');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow all origins in production
    callback(null, true);
  },
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.send(`Honeybee backend running on port ${PORT}`);
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(503).json({
      ok: false,
      database: 'unavailable',
      message: 'Database connection failed',
      code: error.code || 'DB_ERROR',
    });
  }
});

app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/coupons', couponRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`Server started on http://localhost:${PORT}`);

  try {
    await pool.query('SELECT 1');
    await ensureTrackingColumns();
    await migrateCoupons();
    await addCouponDiscountColumns();
    console.log('Connected to MySQL');
    console.log('Order tracking columns are ready');
    console.log('Coupon tables are ready');
    console.log('Coupon discount columns are ready');
  } catch (error) {
    console.warn('⚠️  Database connection warning (non-critical):', error.code || error.message);
    console.log('Server will run without database - API endpoints may return empty data');
  }
});

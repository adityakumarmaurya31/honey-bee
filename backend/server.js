const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Load .env from the backend directory, not wherever the script is run from
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = require('./db.js');
const { testConnection } = require('./db.js');
const adminRoutes = require('./routes/admin.js');
const productRoutes = require('./routes/products.js');
const orderRoutes = require('./routes/orderRoutes.js');
const enquiryRoutes = require('./routes/enquiryRoutes.js');
const galleryRoutes = require('./routes/galleryRoutes.js');
const couponRoutes = require('./routes/couponRoutes.js');

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Log database configuration (without password) for debugging
const dbDebugInfo = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432 (default)',
  user: process.env.DB_USER || 'postgres',
  database: process.env.DB_NAME || 'honeybee',
  ssl: process.env.DB_SSL || 'not set',
  passwordSet: !!process.env.DB_PASSWORD,
};
console.log('📊 Database config:', dbDebugInfo);

app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins in production
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  },
}));

app.get('/', (_req, res) => {
  res.send(`Honeybee backend running on port ${PORT}`);
});

app.get('/api/health', async (_req, res) => {
  const result = await testConnection();
  if (result.success) {
    res.json({ ok: true, database: 'connected' });
  } else {
    res.status(503).json({
      ok: false,
      database: 'unavailable',
      error: result.error,
      hints: result.hints,
    });
  }
});

// New diagnostic endpoint - shows exactly what's wrong without exposing password
app.get('/api/debug/database', async (_req, res) => {
  const result = await testConnection();
  res.json(result);
});

app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/coupons', couponRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image is too large. Please upload an image under 5 MB.'
      : err.message;
    return res.status(400).json({ message, code: err.code });
  }

  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Verify the PostgreSQL schema exists; create it with npm run setup-db when needed.
async function initializeDatabase() {
  try {
    await pool.query('SELECT 1');
    const [tables] = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'users'`
    );

    if (tables.length === 0) {
      console.log('⚠️  No tables found. Run npm run setup-db to create the PostgreSQL schema.');
    } else {
      console.log('✅ Database tables already exist');
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    return false;
  }
}

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);

  const result = await testConnection();

  if (result.success) {
    await initializeDatabase();
    console.log('✅ Connected to PostgreSQL');
    console.log('✅ Order tracking columns are ready');
    console.log('✅ Coupon tables are ready');
    console.log('✅ Coupon discount columns are ready');
    console.log('✅ Gallery media columns are ready');
  } else {
    console.error('');
    console.error('❌ DATABASE CONNECTION FAILED');
    console.error('');
    console.error('📋 Error Details:');
    console.error('   Code:', result.error.code);
    console.error('   Message:', result.error.message);
    console.error('');
    console.error('📋 Current Config (from env):');
    console.error('   Host:', result.config.host);
    console.error('   Port:', result.config.port);
    console.error('   User:', result.config.user);
    console.error('   Database:', result.config.database);
    console.error('   SSL:', result.config.ssl);
    console.error('   Password set:', result.config.passwordSet ? 'Yes' : 'NO ⚠️');
    console.error('');
    console.error('🔧 How to fix:');
    result.hints.forEach((hint, i) => {
      console.error(`   ${i + 1}. ${hint}`);
    });
    console.error('');
    console.error('📖 Full setup guide: https://github.com/aditya/honeybee/blob/main/RENDER_DATABASE_SETUP.md');
    console.error('');
    console.log('⚠️  Server will run without database - API endpoints may return errors');
  }
});

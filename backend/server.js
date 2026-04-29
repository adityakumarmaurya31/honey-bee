const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env from the backend directory, not wherever the script is run from
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = require('./db.js');
const { testConnection } = require('./db.js');
const ensureTrackingColumns = require('./ensureTrackingColumns.js');
const { migrateCoupons } = require('./migrate-coupons.js');
const addCouponDiscountColumns = require('./migrate-coupon-discount.js');
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
  port: process.env.DB_PORT || '3306 (default)',
  user: process.env.DB_USER || 'root',
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  res.status(500).json({ message: 'Internal server error' });
});

// Auto-run schema.sql if tables don't exist
async function initializeDatabase() {
  try {
    // Test basic connection first
    await pool.query('SELECT 1');

    const dbName = process.env.DB_NAME || 'honeybee';
    
    // Check if 'users' table exists
    const [tables] = await pool.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [dbName]
    );

    if (tables.length === 0) {
      console.log('⚠️  No tables found. Running schema.sql to initialize database...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Skip CREATE DATABASE and USE statements (Railway doesn't allow CREATE DATABASE)
        // Just keep the table creation statements
        schemaSQL = schemaSQL
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith('CREATE DATABASE') && 
                   !trimmed.startsWith('USE ') &&
                   trimmed.length > 0;
          })
          .join('\n');
        
        // Split by semicolon and execute each statement
        const statements = schemaSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        for (const stmt of statements) {
          try {
            await pool.query(stmt);
          } catch (e) {
            // Ignore "table already exists" and "duplicate key" errors
            if (!e.message.includes('already exists') && !e.message.includes('Duplicate')) {
              console.warn('⚠️  Schema warning:', e.message);
            }
          }
        }
        console.log('✅ Database schema initialized successfully');
      } else {
        console.warn('⚠️  schema.sql not found at', schemaPath);
      }
    } else {
      console.log('✅ Database tables already exist');
    }

    // Run migrations
    await ensureTrackingColumns();
    await migrateCoupons();
    await addCouponDiscountColumns();

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
    console.log('✅ Connected to MySQL');
    console.log('✅ Order tracking columns are ready');
    console.log('✅ Coupon tables are ready');
    console.log('✅ Coupon discount columns are ready');
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


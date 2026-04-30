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

// Auto-run schema creation if tables don't exist
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
      console.log('⚠️  No tables found. Creating database schema...');
      
      // Create tables with hardcoded SQL (more reliable than parsing)
      const createTableStatements = [
        `CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(200) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin','user') NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          discount DECIMAL(5,2) DEFAULT 0,
          stock INT NOT NULL DEFAULT 0,
          image VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS coupons (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          discount_type ENUM('percentage', 'fixed') NOT NULL,
          discount_value DECIMAL(10,2) NOT NULL,
          max_discount DECIMAL(10,2) NULL,
          min_amount DECIMAL(10,2) NULL,
          description TEXT,
          usage_limit INT NULL,
          expiry_date DATETIME NULL,
          is_active TINYINT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          customer_name VARCHAR(100) NOT NULL,
          customer_email VARCHAR(100) NOT NULL,
          customer_phone VARCHAR(20) NOT NULL,
          delivery_address TEXT NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          payment_method ENUM('card', 'upi', 'cod') NOT NULL,
          order_status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
          tracking_number VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS enquiries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS gallery (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          image_url VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS coupon_usage (
          id INT AUTO_INCREMENT PRIMARY KEY,
          coupon_id INT NOT NULL,
          order_id INT NOT NULL,
          user_email VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (coupon_id) REFERENCES coupons(id),
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )`
      ];

      console.log(`📊 Creating ${createTableStatements.length} tables...`);
      let successCount = 0;

      for (const stmt of createTableStatements) {
        try {
          await pool.query(stmt);
          successCount++;
          const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] || 'unknown';
          console.log(`✅ Created table: ${tableName}`);
        } catch (e) {
          if (e.message.includes('already exists')) {
            const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] || 'unknown';
            console.log(`⏭️  Table already exists: ${tableName}`);
          } else {
            console.error('❌ Table creation error:', e.message.substring(0, 80));
          }
        }
      }
      
      console.log(`✅ Database schema initialized (${successCount}/${createTableStatements.length} tables)`);
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

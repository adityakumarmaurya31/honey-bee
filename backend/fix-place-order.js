const pool = require('./db.js');

const fixPlaceOrderBug = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('Starting database migration...');

    // Create coupons table if it doesn't exist
    console.log('Checking coupons table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS coupons (
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
      )
    `);
    console.log('✓ Coupons table checked/created');

    // Create coupon_usage table if it doesn't exist
    console.log('Checking coupon_usage table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        order_id INT NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        UNIQUE KEY unique_coupon_order (coupon_id, order_id)
      )
    `);
    console.log('✓ Coupon_usage table checked/created');

    // Add coupon columns to orders if they don't exist
    console.log('Checking coupon columns on orders table...');
    try {
      await conn.query('ALTER TABLE orders ADD COLUMN coupon_id INT NULL AFTER paymentMethod');
      console.log('✓ coupon_id column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ coupon_id column already exists');
      } else {
        throw err;
      }
    }

    try {
      await conn.query('ALTER TABLE orders ADD COLUMN coupon_discount DECIMAL(10,2) DEFAULT 0 AFTER coupon_id');
      console.log('✓ coupon_discount column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ coupon_discount column already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    console.log('The "Place Order" button should now work correctly.');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    conn.release();
    process.exit(0);
  }
};

fixPlaceOrderBug().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

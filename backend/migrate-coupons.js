const pool = require('./db.js');

const migrateCoupons = async () => {
  try {
    // Create coupons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        max_discount DECIMAL(10,2) NULL COMMENT 'Max discount for percentage coupons',
        min_amount DECIMAL(10,2) NULL COMMENT 'Minimum order amount',
        description TEXT,
        usage_limit INT NULL COMMENT 'Null for unlimited',
        expiry_date DATETIME NULL,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Create coupon_usage table to track how many times each coupon is used
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        order_id INT NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        UNIQUE KEY unique_coupon_order (coupon_id, order_id)
      );
    `);

    console.log('✅ Coupons tables created/updated successfully');
  } catch (error) {
    console.error('❌ Error migrating coupons:', error);
    throw error;
  }
};

module.exports = { migrateCoupons };

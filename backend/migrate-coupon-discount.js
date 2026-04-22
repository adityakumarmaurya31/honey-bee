const pool = require('./db.js');

const addCouponDiscountColumns = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if column already exists
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='coupon_discount'`
    );

    if (columns.length === 0) {
      console.log('Adding coupon_discount columns to orders table...');
      
      // Add coupon_id column
      await connection.query(
        `ALTER TABLE orders ADD COLUMN coupon_id INT NULL AFTER paymentMethod`
      );

      // Add coupon_discount column
      await connection.query(
        `ALTER TABLE orders ADD COLUMN coupon_discount DECIMAL(10,2) DEFAULT 0 AFTER coupon_id`
      );

      // Add foreign key if not exists
      const [keys] = await connection.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME='orders' AND COLUMN_NAME='coupon_id' AND REFERENCED_TABLE_NAME='coupons'`
      );

      if (keys.length === 0) {
        try {
          await connection.query(
            `ALTER TABLE orders ADD FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL`
          );
        } catch (err) {
          console.log('Foreign key may already exist or coupons table missing');
        }
      }

      console.log('✓ Coupon discount columns added successfully');
    } else {
      console.log('✓ Coupon discount columns already exist');
    }

    connection.release();
  } catch (err) {
    console.error('Error adding coupon discount columns:', err.message);
  }
};

module.exports = addCouponDiscountColumns;

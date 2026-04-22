const pool = require('./db.js');

(async () => {
  try {
    // Check recent orders with coupon info
    const [orders] = await pool.query(
      'SELECT id, user_id, total, coupon_id, coupon_discount, created_at FROM orders ORDER BY created_at DESC LIMIT 3'
    );
    
    console.log('📦 Recent orders from database:\n');
    orders.forEach(o => {
      console.log(`Order #${o.id}:`);
      console.log(`  - Total: ₹${o.total}`);
      console.log(`  - Coupon ID: ${o.coupon_id}`);
      console.log(`  - Coupon Discount: ₹${o.coupon_discount}`);
      console.log();
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

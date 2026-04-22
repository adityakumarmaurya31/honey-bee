const pool = require('./db.js');

(async () => {
  try {
    console.log('🔍 Testing coupon system...\n');

    // 1. Check coupons
    const [coupons] = await pool.query('SELECT id, code, discount_type, discount_value, is_active, expiry_date FROM coupons LIMIT 5');
    console.log('📋 Available coupons:');
    coupons.forEach(c => {
      const expiry = new Date(c.expiry_date);
      const isExpired = expiry < new Date();
      console.log(`   - ${c.code}: ${c.discount_value}${c.discount_type === 'percentage' ? '%' : '₹'} off (Active: ${c.is_active}, Expired: ${isExpired})`);
    });

    // 2. Check recent orders with coupons
    const [orders] = await pool.query(
      'SELECT id, total, coupon_id, coupon_discount, created_at FROM orders ORDER BY created_at DESC LIMIT 3'
    );
    console.log('\n📦 Recent orders:');
    orders.forEach(o => {
      console.log(`   - Order #${o.id}: Total ₹${o.total}, Coupon Discount ₹${o.coupon_discount || 0}`);
    });

    // 3. Check detailed coupon info
    console.log('\n✅ Coupon system status:');
    if (coupons.length > 0) {
      const [couponUsage] = await pool.query(
        'SELECT COUNT(*) as used FROM coupon_usage WHERE coupon_id = ?',
        [coupons[0].id]
      );
      console.log(`   - Coupon ${coupons[0].code} used: ${couponUsage[0].used} times`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

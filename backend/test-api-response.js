const pool = require('./db.js');

(async () => {
  try {
    console.log('🔍 Testing getUserOrders API response...\n');

    // Simulate getUserOrders API call
    const email = 'gg@gmail.com';
    
    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total, o.created_at,
              o.address, o.city, o.state, o.pincode, o.phone, o.paymentMethod,
              o.trackingNumber, o.trackingAssignedAt, o.coupon_discount,
              u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE u.email = ?
       ORDER BY o.created_at DESC`,
      [email]
    );

    console.log(`📦 Found ${orders.length} orders for ${email}\n`);

    if (orders.length > 0) {
      const order = orders[0];
      console.log(`Order #${order.id}:`);
      console.log(`  - Status: ${order.status}`);
      console.log(`  - Total: ₹${order.total}`);
      console.log(`  - Coupon Discount: ₹${order.coupon_discount}`);

      // Get items for this order
      const [items] = await pool.query(
        `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, p.name AS product_name, p.image AS product_image, COALESCE(p.discount, 0) AS discount
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      console.log(`\n  📋 Items: ${items.length}`);
      items.forEach(item => {
        console.log(`     - ${item.product_name}: ${item.quantity}x @ ₹${item.price}`);
      });

      // Check if all required fields are present
      console.log('\n✅ Order structure:');
      console.log(`   - Has items: ${items.length > 0}`);
      console.log(`   - Has coupon_discount: ${order.coupon_discount !== undefined}`);
      console.log(`   - Is Delivered: ${order.status === 'Delivered'}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

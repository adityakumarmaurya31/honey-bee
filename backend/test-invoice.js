const pool = require('./db.js');

(async () => {
  try {
    console.log('🔍 Testing invoice endpoints...\n');

    // Test 1: Check if orders have all required fields for invoice
    const [orders] = await pool.query(
      'SELECT id, user_id, total, coupon_discount, status FROM orders ORDER BY created_at DESC LIMIT 3'
    );

    console.log('📦 Orders with invoice data:');
    orders.forEach(o => {
      console.log(`   Order #${o.id}: Status=${o.status}, Total=₹${o.total}, Coupon=₹${o.coupon_discount}`);
    });

    // Test 2: Check order items
    if (orders.length > 0) {
      const [items] = await pool.query(
        'SELECT * FROM order_items WHERE order_id = ? LIMIT 2',
        [orders[0].id]
      );
      console.log(`\n📋 Items in Order #${orders[0].id}: ${items.length} items`);
      items.forEach(item => {
        console.log(`   - Product #${item.product_id}: ${item.quantity}x @ ₹${item.price}`);
      });
    }

    // Test 3: Check if any order is Delivered
    const [deliveredOrders] = await pool.query(
      'SELECT id, status FROM orders WHERE status = "Delivered" LIMIT 1'
    );
    console.log(`\n✅ Delivered orders: ${deliveredOrders.length}`);
    if (deliveredOrders.length > 0) {
      console.log(`   - Order #${deliveredOrders[0].id} is available for invoice`);
    } else {
      console.log('   - No delivered orders yet (invoice only available after delivery)');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

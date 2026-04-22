const http = require('http');

(async () => {
  try {
    console.log('📋 Checking Invoice for Order #24...\n');

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/user?email=test@gmail.com',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📡 Response Status:', res.statusCode);
        
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            console.log(`\n✅ Found ${parsed.length} order(s):\n`);
            parsed.forEach(order => {
              console.log(`Order #${order.id}:`);
              console.log(`  Status: ${order.status}`);
              console.log(`  Total: ₹${order.total}`);
              console.log(`  Coupon Discount: ₹${order.coupon_discount}`);
              console.log(`  Items: ${order.items?.length || 0}`);
              if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                  console.log(`    - ${item.product_name} x${item.quantity} = ₹${item.price * item.quantity}`);
                });
              }
              console.log();
            });
          }
        } catch (e) {
          console.log('Data:', data);
        }
        
        process.exit(0);
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });

    req.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

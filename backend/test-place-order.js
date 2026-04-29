const http = require('http');

(async () => {
  try {
    console.log('🛒 Testing Place Order (COD) API...\n');

    const orderData = {
      name: "Test Customer",
      email: "test.customer@example.com",
      phone: "9876543210",
      address: "123 Test Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      paymentMethod: "COD",
      items: [
        {
          product_id: 6,
          quantity: 1
        }
      ],
      coupon_id: null,
      coupon_discount: 0
    };

    const body = JSON.stringify(orderData);

    const options = {
      hostname: 'localhost',
      port: 10000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📡 API Response Status:', res.statusCode);
        console.log('📋 Response Data:\n');
        
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          if (parsed.orderId) {
            console.log('\n✅ Order created successfully! Order ID:', parsed.orderId);
          } else if (parsed.message) {
            console.log('\n❌ Error:', parsed.message);
          }
        } catch (e) {
          console.log('Raw:', data);
        }
        
        process.exit(0);
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });

    console.log('📤 Sending order request...\n');
    req.write(body);
    req.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

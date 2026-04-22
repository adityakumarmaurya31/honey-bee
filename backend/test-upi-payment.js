const http = require('http');

(async () => {
  try {
    console.log('🧪 Testing UPI Payment System...\n');

    // Test data
    const testPayload = {
      transactionId: 'UPI123456789ABC',
      amount: 1008,
      name: 'Test User',
      email: 'test@gmail.com',
      phone: '9999999999',
      address: 'Test Address 123',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      items: [
        {
          product_id: 6,
          quantity: 1
        }
      ],
      coupon_id: null,
      coupon_discount: 0,
      upiId: 'adikumau@oksbi'
    };

    const postData = JSON.stringify(testPayload);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/verify-upi',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📤 Sending UPI verification request...');
    console.log('Payload:', testPayload);
    console.log('\n');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📡 Response Status:', res.statusCode);
        console.log('📋 Response Data:\n');
        
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          
          if (res.statusCode === 201) {
            console.log('\n✅ UPI Payment Created Successfully!');
            console.log(`Order ID: ${parsed.orderId}`);
            console.log(`Amount: ₹${parsed.total}`);
            console.log(`Status: ${parsed.status}`);
          } else {
            console.log('\n❌ Error creating UPI order');
          }
        } catch (e) {
          console.log('Raw:', data);
        }
        
        process.exit(0);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      process.exit(1);
    });

    req.write(postData);
    req.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

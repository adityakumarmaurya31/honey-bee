const http = require('http');

(async () => {
  try {
    console.log('🔍 Testing API for cc@gmail.com...\n');

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/user?email=cc@gmail.com',
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
        console.log('📡 API Response Status:', res.statusCode);
        console.log('📋 Response Data:\n');
        
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('\n✅ Found orders:', parsed.map(o => ({ id: o.id, status: o.status, coupon_discount: o.coupon_discount })));
          } else {
            console.log('\n❌ No orders found for this email');
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

    req.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

const http = require('http');

(async () => {
  try {
    console.log('🔍 Testing Order Validation with Missing Field...\n');

    // Test 1: Missing email field
    const testCases = [
      {
        name: "Missing Email",
        data: {
          name: "Test User",
          email: "",  // Missing!
          phone: "9876543210",
          address: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          paymentMethod: "COD",
          items: [{ product_id: 6, quantity: 1 }],
          coupon_id: null,
          coupon_discount: 0
        }
      },
      {
        name: "Missing Phone",
        data: {
          name: "Test User",
          email: "test@example.com",
          phone: "",  // Missing!
          address: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          paymentMethod: "COD",
          items: [{ product_id: 6, quantity: 1 }],
          coupon_id: null,
          coupon_discount: 0
        }
      },
      {
        name: "Invalid Phone (too short)",
        data: {
          name: "Test User",
          email: "test@example.com",
          phone: "123",  // Invalid!
          address: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          paymentMethod: "COD",
          items: [{ product_id: 6, quantity: 1 }],
          coupon_id: null,
          coupon_discount: 0
        }
      },
      {
        name: "All Fields Valid",
        data: {
          name: "Test User",
          email: "test@example.com",
          phone: "9876543210",
          address: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          paymentMethod: "COD",
          items: [{ product_id: 6, quantity: 1 }],
          coupon_id: null,
          coupon_discount: 0
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log('─'.repeat(50));

      const body = JSON.stringify(testCase.data);

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

      await new Promise((resolve) => {
        const req = http.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.message) {
                console.log(`Message: ${parsed.message}`);
              }
              if (parsed.orderId) {
                console.log(`✅ Order Created! ID: ${parsed.orderId}`);
              }
            } catch (e) {
              console.log('Response:', data);
            }
            
            resolve();
          });
        });

        req.on('error', (error) => {
          console.error('Error:', error.message);
          resolve();
        });

        req.write(body);
        req.end();
      });
    }

    console.log('\n\n✅ Validation tests completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

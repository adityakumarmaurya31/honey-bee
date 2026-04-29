const http = require('http');

(async () => {
  try {
    console.log('📦 Fetching products from API...\n');

    const options = {
      hostname: 'localhost',
      port: 10000,
      path: '/api/products',
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
          if (Array.isArray(parsed)) {
            console.log(`✅ Retrieved ${parsed.length} products:\n`);
            parsed.slice(0, 3).forEach((product, idx) => {
              console.log(`Product ${idx + 1}:`);
              console.log(`  ID: ${product.id}`);
              console.log(`  Name: ${product.name?.substring(0, 50)}...`);
              console.log(`  Price: ₹${product.price}`);
              console.log(`  Discount: ${product.discount}%`);
              console.log('');
            });
          } else {
            console.log(JSON.stringify(parsed, null, 2));
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

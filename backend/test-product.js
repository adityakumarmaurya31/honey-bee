const mysql = require('mysql2/promise');

(async () => {
  try {
    console.log('🔍 Checking Product #6...\n');

    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '22Btcs@#0538',
      database: 'honeybee',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    
    // Check if product 6 exists
    const [products] = await connection.query(
      'SELECT id, name, price, discount, stock FROM products WHERE id = ?',
      [6]
    );

    console.log('Product #6 Details:');
    if (products.length > 0) {
      const product = products[0];
      console.log(JSON.stringify(product, null, 2));
      console.log('\n✅ Product found!');
      
      // Calculate discounted price
      const price = Number(product.price);
      const discount = Number(product.discount) || 0;
      const unitPrice = Number((price * (1 - discount / 100)).toFixed(2));
      
      console.log(`\nPrice calculation:`);
      console.log(`  Original Price: ₹${price}`);
      console.log(`  Discount: ${discount}%`);
      console.log(`  Discounted Unit Price: ₹${unitPrice}`);
    } else {
      console.log('❌ Product #6 not found!');
    }

    await connection.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

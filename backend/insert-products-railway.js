const mysql = require('mysql2/promise');

const sampleProducts = [
  {
    name: 'Saumya Honey - Forest Orchards',
    description: 'Bold, dark honey from diverse forest orchards of Uttar Pradesh. Good for immunity, sore throat, and daily sweetener.',
    price: 399.00,
    discount: 0,
    stock: 50,
    image: '/honey.jpg'
  },
  {
    name: 'Saumya Honey - Lychee Orchards',
    description: 'Light, floral honey collected from lychee orchards of North India. Perfect for desserts, pancakes and kids.',
    price: 449.00,
    discount: 0,
    stock: 45,
    image: '/hero-honey.jpg'
  },
  {
    name: 'Saumya Honey - Family Pack 1kg',
    description: 'Blend of multiple orchard flowers for everyday use. Ideal daily sweetener alternative to sugar.',
    price: 699.00,
    discount: 0,
    stock: 30,
    image: '/honey.jpg'
  },
  {
    name: 'Saumya Premium Raw Honey',
    description: 'Premium raw honey with all nutrients intact. No heating, no processing, pure natural goodness.',
    price: 599.00,
    discount: 50.00,
    stock: 25,
    image: '/honey.jpg'
  },
  {
    name: 'Saumya Honey Gift Box',
    description: 'Beautiful gift package with 2x 500g jars. Perfect for gifting to loved ones.',
    price: 899.00,
    discount: 0,
    stock: 20,
    image: '/hero-honey.jpg'
  }
];

async function insertProducts() {
  let connection;
  try {
    console.log('🔌 Connecting to Railway database...');
    
    // Production database credentials for Railway
    connection = await mysql.createConnection({
      host: 'switchback.proxy.rlwy.net',
      port: 44833,
      user: 'root',
      password: 'XAbeSGgpOgNlAIfQulYnqJkaybOkKEsQ',
      database: 'railway',
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Connected to Railway!');
    
    // Check existing products
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 Current products in database: ${existing[0].count}`);

    if (existing[0].count > 0) {
      console.log('✅ Products already exist. Skipping insert.');
      await connection.end();
      process.exit(0);
    }

    console.log('🍯 Inserting sample products...');
    
    for (const product of sampleProducts) {
      const [result] = await connection.query(
        'INSERT INTO products (name, description, price, discount, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
        [product.name, product.description, product.price, product.discount, product.stock, product.image]
      );
      console.log(`✅ Added (ID: ${result.insertId}): ${product.name}`);
    }

    console.log(`\n✅ Successfully added ${sampleProducts.length} sample products to Railway!`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

insertProducts();

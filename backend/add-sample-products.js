const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = require('./db.js');

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

async function addSampleProducts() {
  try {
    // Check if products already exist
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM products');
    
    if (existing[0].count > 0) {
      console.log(`✅ Products already exist (${existing[0].count} products). Skipping insert.`);
      process.exit(0);
    }

    console.log('🍯 Adding sample products to database...');
    
    for (const product of sampleProducts) {
      await pool.query(
        'INSERT INTO products (name, description, price, discount, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
        [product.name, product.description, product.price, product.discount, product.stock, product.image]
      );
      console.log(`✅ Added: ${product.name}`);
    }

    console.log(`\n✅ Successfully added ${sampleProducts.length} sample products!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding products:', error.message);
    process.exit(1);
  }
}

addSampleProducts();

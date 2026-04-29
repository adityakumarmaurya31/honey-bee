const mysql = require('mysql2/promise');

const sampleGallery = [
  {
    title: 'Honey Harvest Season',
    description: 'Fresh honey collection from our orchards in Prayagraj',
    image_url: '/hero-honey.jpg'
  },
  {
    title: 'Bee Keeping Process',
    description: 'Our careful bee keeping practices ensure pure, quality honey',
    image_url: '/honey.jpg'
  },
  {
    title: 'Honey Bottling',
    description: 'Each jar is carefully filled with love and precision',
    image_url: '/hero-honey.jpg'
  },
  {
    title: 'Orchard Flowers',
    description: 'Beautiful floral varieties that create our unique honey blend',
    image_url: '/honey.jpg'
  },
  {
    title: 'Quality Check',
    description: 'Every batch undergoes strict quality testing',
    image_url: '/hero-honey.jpg'
  }
];

async function insertGallery() {
  let connection;
  try {
    console.log('🔌 Connecting to Railway database...');
    
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
    
    // Check existing gallery items
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM gallery');
    console.log(`📊 Current gallery items: ${existing[0].count}`);

    if (existing[0].count > 0) {
      console.log('✅ Gallery items already exist. Skipping insert.');
      await connection.end();
      process.exit(0);
    }

    console.log('🖼️ Inserting sample gallery items...');
    
    for (const item of sampleGallery) {
      const [result] = await connection.query(
        'INSERT INTO gallery (title, description, media_url) VALUES (?, ?, ?)',
        [item.title, item.description, item.image_url]
      );
      console.log(`✅ Added (ID: ${result.insertId}): ${item.title}`);
    }

    console.log(`\n✅ Successfully added ${sampleGallery.length} sample gallery items to Railway!`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

insertGallery();

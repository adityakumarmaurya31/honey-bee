/**
 * Setup script to initialize database schema
 * Run with: node setup-database.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('./db.js');

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to MySQL server');
  } catch (err) {
    console.error('❌ Cannot connect to MySQL server');
    console.error('   Error:', err.message);
    console.error('   Make sure DB_HOST, DB_USER, DB_PASSWORD are correct in .env');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql not found at:', schemaPath);
    process.exit(1);
  }

  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

  // Split and execute statements
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.split('\n')[0].trim();
    try {
      await pool.query(stmt);
      console.log(`✅ [${i + 1}/${statements.length}] ${firstLine.substring(0, 60)}...`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`⚠️  [${i + 1}/${statements.length}] Already exists, skipping`);
      } else {
        console.error(`❌ [${i + 1}/${statements.length}] Error: ${err.message}`);
      }
    }
  }

  console.log('\n🎉 Database setup complete!');
  console.log('   You can now start the server with: npm start');
  process.exit(0);
}

setupDatabase();


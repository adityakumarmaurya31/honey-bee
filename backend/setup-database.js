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
    console.log('✅ Connected to PostgreSQL server');
  } catch (err) {
    console.error('❌ Cannot connect to MySQL server');
    console.error('   Error:', err.message);
    console.error('   Make sure the PostgreSQL connection values are correct in .env');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql not found at:', schemaPath);
    process.exit(1);
  }

  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

  // Remove comments before splitting so comments do not hide the SQL that follows them.
  const statements = schemaSQL
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

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


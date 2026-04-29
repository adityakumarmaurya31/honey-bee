/**
 * Diagnostic script to test database connection
 * Run locally with: node test-connection.js
 * This uses the SAME env variables as your server
 */
const { testConnection } = require('./db.js');

(async () => {
  console.log('🔍 Testing database connection...\n');

  const result = await testConnection();

  if (result.success) {
    console.log('✅ SUCCESS! Database is connected.');
    console.log('');
    console.log('📋 Config used:');
    console.log('   Host:', result.config.host);
    console.log('   Port:', result.config.port);
    console.log('   User:', result.config.user);
    console.log('   Database:', result.config.database);
    console.log('   SSL:', result.config.ssl);
    console.log('');
    console.log('🚀 Your backend should work on Render with these settings.');
    process.exit(0);
  } else {
    console.log('❌ FAILED to connect to database.\n');
    console.log('📋 Config used:');
    console.log('   Host:', result.config.host);
    console.log('   Port:', result.config.port);
    console.log('   User:', result.config.user);
    console.log('   Database:', result.config.database);
    console.log('   SSL:', result.config.ssl);
    console.log('   Password set:', result.config.passwordSet ? 'Yes' : 'NO');
    console.log('');
    console.log('❌ Error:', result.error.code);
    console.log('   Message:', result.error.message);
    console.log('');
    console.log('🔧 Fix suggestions:');
    result.hints.forEach((hint, i) => {
      console.log(`   ${i + 1}. ${hint}`);
    });
    console.log('');
    console.log('📖 Next steps:');
    console.log('   1. Fix the issue above');
    console.log('   2. Run this script again: node test-connection.js');
    console.log('   3. Once it passes, update your Render environment variables');
    console.log('   4. Re-deploy to Render');
    process.exit(1);
  }
})();


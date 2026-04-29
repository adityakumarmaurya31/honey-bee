const pool = require('./db.js');

(async () => {
  try {
    console.log('🔐 Testing with different password approach...');

    // Try setting admin password to bcrypt hash of "test123" 
    // Hash generated separately to ensure it works
    const testHash = '$2a$12$FOpEYXvLV6tPm89Eg6.2te8gUyLFNAQWz0zp7GvTdCFJRwvNb8.ma'; // bcrypt of 'test123'
    
    console.log('Updating password to test hash...');
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [testHash, 'admin@honeybee.com']
    );
    
    console.log('Update result:', result);
    
    console.log('\n✅ Password updated. Try login with:');
    console.log('  Email: admin@honeybee.com');
    console.log('  Password: test123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();

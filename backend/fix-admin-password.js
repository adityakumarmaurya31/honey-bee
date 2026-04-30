const pool = require('./db.js');

(async () => {
  try {
    // Correct bcrypt hash for 'Admin@123'
    const hash = '$2b$12$LxBOAtbv0SgwfAuPWJeGRuDmXdzGuAwJxHXCevnwas8SLQ9p5A1ZK';
    
    console.log('🔐 Updating admin password to Admin@123...');
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, 'admin@honeybee.com']
    );
    
    console.log('✅ Updated', result.affectedRows, 'rows');
    
    // Verify
    const [check] = await pool.query('SELECT email, password FROM users WHERE email = ?', ['admin@honeybee.com']);
    if (check.length > 0) {
      console.log('Verified hash (first 30 chars):', check[0].password.substring(0, 30));
    }
    
    console.log('\n📧 Admin Credentials Ready:');
    console.log('Email: admin@honeybee.com');
    console.log('Password: Admin@123');
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

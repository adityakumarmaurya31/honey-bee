const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'switchback.proxy.rlwy.net',
      port: 44833,
      user: 'root',
      password: 'XAbeSGgpOgNlAIfQulYnqJkaybOkKEsQ',
      database: 'railway',
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔐 Connected to Railway database...');
    
    // Correct bcrypt hash for 'Admin@123'
    const correctHash = '$2b$12$LxBOAtbv0SgwfAuPWJeGRuDmXdzGuAwJxHXCevnwas8SLQ9p5A1ZK';
    
    console.log('Updating admin password...');
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [correctHash, 'admin@honeybee.com']
    );
    
    console.log('✅ Updated', result.affectedRows, 'rows on Railway');
    console.log('\n📧 Admin Credentials (Production):');
    console.log('Email: admin@honeybee.com');
    console.log('Password: Admin@123');
    console.log('Role: admin');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

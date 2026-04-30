const bcrypt = require('bcryptjs');
const pool = require('./db.js');

(async () => {
  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE email = ?', ['admin@honeybee.com']);
    if (rows.length === 0) {
      console.log('No user found');
      process.exit(1);
    }
    
    const password = 'Admin@123';
    const hash = rows[0].password;
    
    console.log('Testing password verification...');
    console.log('Password: Admin@123');
    console.log('Hash: ' + hash.substring(0, 30) + '...');
    
    const isMatch = await bcrypt.compare(password, hash);
    console.log('\nbcrypt.compare result:', isMatch);
    
    if (isMatch) {
      console.log('✅ Password matches - login WILL WORK!');
    } else {
      console.log('❌ Password does not match');
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

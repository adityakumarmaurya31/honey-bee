const pool = require('./db.js');

(async () => {
  try {
    console.log('Checking all users with admin role:');
    const [adminUsers] = await pool.query('SELECT id, name, email, role FROM users WHERE role = ?', ['admin']);
    console.log('Admin users:', adminUsers);

    console.log('\nChecking specific user:');
    const [specificUser] = await pool.query('SELECT id, name, email, role, password FROM users WHERE email = ?', ['admin@honeybee.com']);
    console.log('User admin@honeybee.com:', specificUser);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();

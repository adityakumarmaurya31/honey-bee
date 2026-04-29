const pool = require('./db.js');

(async () => {
  try {
    console.log('ALL USERS IN DATABASE:');
    const [allUsers] = await pool.query('SELECT id, name, email, role FROM users ORDER BY id');
    console.log(JSON.stringify(allUsers, null, 2));
    
    console.log('\n\nALL ADMIN USERS:');
    const [adminUsers] = await pool.query('SELECT id, name, email, role, password FROM users WHERE role = ?', ['admin']);
    console.log(JSON.stringify(adminUsers, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();

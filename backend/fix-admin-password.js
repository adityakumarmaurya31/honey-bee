const pool = require('./db.js');

async function fixAdminPassword() {
  try {
    const conn = await pool.getConnection();

    console.log('Connected to database...');
    
    // Delete existing admin user
    await conn.execute("DELETE FROM users WHERE email='admin@honeybee.com'");
    console.log('Old admin user deleted');
    
    // Insert new admin user with correct password hash
    const passwordHash = '$2b$10$LPuDcgTkh6FrXs2celOsveCKlHAYEx8ksnwBuuOiBEJ8iMZrOQSc2';
    await conn.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Admin User', 'admin@honeybee.com', passwordHash, 'admin']
    );
    console.log('✓ Admin password updated successfully!');
    console.log('Email: admin@honeybee.com');
    console.log('Password: admin123');
    
    conn.release();
  } catch (error) {
    console.error('Error updating admin password:', error.message);
    process.exit(1);
  }
}

fixAdminPassword();

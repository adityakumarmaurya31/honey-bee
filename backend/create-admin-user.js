const bcrypt = require('bcryptjs');
const pool = require('./db.js');
const dotenv = require('dotenv');

dotenv.config();

const createAdminUser = async () => {
  try {
    console.log('🔐 Creating admin user...');

    // Admin credentials
    const adminEmail = 'admin@honeybee.com';
    const adminPassword = 'Admin@123'; // Change this!
    const adminName = 'Admin';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Check if admin already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      [adminEmail, 'admin']
    );

    if (existing.length > 0) {
      console.log('✅ Admin user already exists:', adminEmail);
      return;
    }

    // Create admin user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [adminName, adminEmail, hashedPassword, 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();

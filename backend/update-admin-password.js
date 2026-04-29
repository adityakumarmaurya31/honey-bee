const pool = require('./db.js');
const dotenv = require('dotenv');

dotenv.config();

const updateAdminPassword = async () => {
  try {
    console.log('🔐 Updating admin password...');

    // Password hash for 'Admin@123'
    const passwordHash = '$2b$10$1FjwRN69HmXk54LX4O3KXeKzBo2BSClLKqnAeP8rh7lqe.h2JuyJy';
    const adminEmail = 'admin@honeybee.com';

    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ? AND role = ?',
      [passwordHash, adminEmail, 'admin']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('\n📋 Admin Credentials:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: Admin@123`);
    } else {
      console.log('⚠️  Admin user not found. Run create-admin-user.js first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateAdminPassword();

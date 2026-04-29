const bcrypt = require('bcryptjs');

const testPassword = 'Admin@123';
const storedHash = '$2b$10$1FjwRN69HmXk54LX4O3KXeKzBo2BSClLKqnAeP8rh7lqe.h2JuyJy';

bcrypt.compare(testPassword, storedHash, (err, isMatch) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password match result:', isMatch);
    if (isMatch) {
      console.log('✅ Password verification WORKS');
    } else {
      console.log('❌ Password verification FAILED');
    }
  }
  process.exit(0);
});

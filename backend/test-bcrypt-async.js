const bcrypt = require('bcryptjs');

// This is what's in the database
const storedHash = '$2b$10$1FjwRN69HmXk54LX4O3KXeKzBo2BSClLKqnAeP8rh7lqe.h2JuyJy';
const password = 'Admin@123';

console.log('Testing password comparison (exactly as backend does it)...\n');
console.log('Stored hash:', storedHash);
console.log('Password to test:', password);

(async () => {
  try {
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('\nbcrypt.compare result:', isMatch);
    
    if (isMatch) {
      console.log('✅ Password MATCHES - Login should work!');
    } else {
      console.log('❌ Password DOES NOT MATCH - Something is wrong!');
    }
  } catch (error) {
    console.error('bcrypt error:', error);
  }
  process.exit(0);
})();

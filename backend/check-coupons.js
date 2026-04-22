const pool = require('./db.js');

(async () => {
  try {
    const [coupons] = await pool.query('SELECT code, expiry_date, is_active FROM coupons');
    console.log('📋 All coupons status:\n');
    coupons.forEach(c => {
      const exp = new Date(c.expiry_date);
      const isExp = exp < new Date();
      const status = c.is_active ? '✅' : '❌';
      console.log(`${status} ${c.code.padEnd(15)} | Expires: ${exp.toLocaleDateString()} | Expired: ${isExp}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

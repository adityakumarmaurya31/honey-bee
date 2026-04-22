const pool = require('./db.js');

(async () => {
  try {
    const [columns] = await pool.query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME="orders"'
    );
    console.log('Orders table columns:');
    columns.forEach(c => console.log('  -', c.COLUMN_NAME));
    
    const [coupons] = await pool.query('SELECT * FROM coupons LIMIT 1');
    console.log('\nActive coupons count:', coupons.length);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

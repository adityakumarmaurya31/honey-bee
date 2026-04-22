const pool = require('./db.js');

(async () => {
  try {
    // Mark orders as Delivered
    await pool.query('UPDATE orders SET status = ? WHERE id IN (?, ?)', ['Delivered', 18, 19]);
    
    // Check the result
    const [result] = await pool.query('SELECT id, status FROM orders WHERE id IN (?, ?)', [18, 19]);
    
    console.log('Updated orders:\n');
    result.forEach(r => {
      console.log(`Order #${r.id}: ${r.status}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

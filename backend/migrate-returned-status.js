const pool = require('./db.js');

async function addReturnedStatus() {
  try {
    const query = "ALTER TABLE orders MODIFY status ENUM('Pending','Shipped','Delivered','Cancelled','Returned') NOT NULL DEFAULT 'Pending'";
    await pool.query(query);
    console.log('✅ Orders table updated with Returned status');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating table:', error.message);
    process.exit(1);
  }
}

addReturnedStatus();

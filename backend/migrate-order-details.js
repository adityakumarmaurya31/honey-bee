const pool = require('./db.js');

async function addOrderDetails() {
  try {
    const query = `
      ALTER TABLE orders
      ADD COLUMN address TEXT NOT NULL AFTER total,
      ADD COLUMN city VARCHAR(120) NOT NULL AFTER address,
      ADD COLUMN state VARCHAR(120) NOT NULL AFTER city,
      ADD COLUMN pincode VARCHAR(20) NOT NULL AFTER state,
      ADD COLUMN phone VARCHAR(20) NOT NULL AFTER pincode,
      ADD COLUMN paymentMethod VARCHAR(50) NOT NULL DEFAULT 'COD' AFTER phone
    `;

    await pool.query(query);
    console.log('Order table updated with address and payment fields');
    process.exit(0);
  } catch (error) {
    console.error('Error updating orders table:', error.message);
    process.exit(1);
  }
}

addOrderDetails();

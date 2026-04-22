const pool = require('./db.js');

async function createEnquiriesTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS enquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(200) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('New','Replied','Closed') NOT NULL DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        replied_at TIMESTAMP NULL,
        admin_reply TEXT NULL
      )
    `;
    await pool.query(query);
    console.log('✅ Enquiries table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating enquiries table:', error.message);
    process.exit(1);
  }
}

createEnquiriesTable();

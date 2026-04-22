const pool = require('./db.js');

const ensureTrackingColumns = async () => {
  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orders'
       AND COLUMN_NAME IN ('trackingNumber', 'trackingAssignedAt')`
  );

  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existingColumns.has('trackingNumber')) {
    await pool.query('ALTER TABLE orders ADD COLUMN trackingNumber VARCHAR(100) UNIQUE NULL AFTER paymentMethod');
  }

  if (!existingColumns.has('trackingAssignedAt')) {
    await pool.query('ALTER TABLE orders ADD COLUMN trackingAssignedAt TIMESTAMP NULL AFTER trackingNumber');
  }
};

module.exports = ensureTrackingColumns;

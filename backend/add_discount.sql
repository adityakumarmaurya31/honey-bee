-- Add discount column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2) DEFAULT 0 COMMENT 'Discount percentage (0-100)';

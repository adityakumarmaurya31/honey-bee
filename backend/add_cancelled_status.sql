-- Add Cancelled status to orders table
ALTER TABLE orders MODIFY status ENUM('Pending','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending';

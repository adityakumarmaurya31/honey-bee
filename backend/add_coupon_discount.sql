-- Add coupon discount fields to orders table
ALTER TABLE orders
ADD COLUMN coupon_id INT NULL AFTER paymentMethod,
ADD COLUMN coupon_discount DECIMAL(10,2) DEFAULT 0 AFTER coupon_id,
ADD FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

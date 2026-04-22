ALTER TABLE orders
ADD COLUMN trackingNumber VARCHAR(100) UNIQUE NULL AFTER paymentMethod,
ADD COLUMN trackingAssignedAt TIMESTAMP NULL AFTER trackingNumber;

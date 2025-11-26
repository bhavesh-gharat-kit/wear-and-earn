-- Database cleanup script to remove unused columns from products table
-- Execute this manually in your MySQL database

USE weareearn;

-- Remove unused columns from products table
ALTER TABLE products DROP COLUMN IF EXISTS profit;
ALTER TABLE products DROP COLUMN IF EXISTS gatewayFee;
ALTER TABLE products DROP COLUMN IF EXISTS manufacturer;
ALTER TABLE products DROP COLUMN IF EXISTS commissionAmount;

-- Verify the changes
DESCRIBE products;

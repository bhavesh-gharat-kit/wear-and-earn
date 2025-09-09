-- CreateEnum for MLM Levels
ALTER TABLE `users` ADD COLUMN `currentLevel` ENUM('NONE', 'L1', 'L2', 'L3', 'L4', 'L5') NOT NULL DEFAULT 'NONE';

-- CreateEnum for KYC Status
ALTER TABLE `users` ADD COLUMN `kycStatusEnum` ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED') NOT NULL DEFAULT 'PENDING';

-- Add new MLM tracking fields
ALTER TABLE `users` ADD COLUMN `firstPurchaseDate` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `totalSelfIncomeEarned` DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD COLUMN `totalPoolIncomeEarned` DOUBLE NOT NULL DEFAULT 0;

-- Add indexes for performance
ALTER TABLE `users` ADD INDEX `users_currentLevel_idx` (`currentLevel`);
ALTER TABLE `users` ADD INDEX `users_kycStatusEnum_idx` (`kycStatusEnum`);
ALTER TABLE `users` ADD INDEX `users_firstPurchaseDate_idx` (`firstPurchaseDate`);
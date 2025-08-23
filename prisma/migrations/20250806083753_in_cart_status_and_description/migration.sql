-- AlterTable
ALTER TABLE `category` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT true;

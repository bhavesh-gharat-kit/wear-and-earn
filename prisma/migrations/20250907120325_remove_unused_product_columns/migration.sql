/*
  Warnings:

  - You are about to drop the column `commissionAmount` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `gatewayFee` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturer` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `profit` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `commissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hierarchy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `matrix_nodes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `commissions` DROP FOREIGN KEY `commissions_fromUserId_fkey`;

-- DropForeignKey
ALTER TABLE `commissions` DROP FOREIGN KEY `commissions_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `commissions` DROP FOREIGN KEY `commissions_userId_fkey`;

-- DropForeignKey
ALTER TABLE `hierarchy` DROP FOREIGN KEY `hierarchy_ancestorId_fkey`;

-- DropForeignKey
ALTER TABLE `hierarchy` DROP FOREIGN KEY `hierarchy_descendantId_fkey`;

-- DropForeignKey
ALTER TABLE `matrix_nodes` DROP FOREIGN KEY `matrix_nodes_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `matrix_nodes` DROP FOREIGN KEY `matrix_nodes_userId_fkey`;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `commissionAmount`,
    DROP COLUMN `gatewayFee`,
    DROP COLUMN `manufacturer`,
    DROP COLUMN `profit`,
    ADD COLUMN `productPrice` DOUBLE NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `directTeams` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `kycStatus` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `level` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `teamCount` INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `commissions`;

-- DropTable
DROP TABLE `hierarchy`;

-- DropTable
DROP TABLE `matrix_nodes`;

-- CreateTable
CREATE TABLE `purchases` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `productId` INTEGER UNSIGNED NOT NULL,
    `orderId` INTEGER UNSIGNED NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `mlmAmount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `purchases_userId_idx`(`userId`),
    INDEX `purchases_type_idx`(`type`),
    INDEX `purchases_createdAt_idx`(`createdAt`),
    INDEX `purchases_orderId_fkey`(`orderId`),
    INDEX `purchases_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `wallet_transactions_userId_idx`(`userId`),
    INDEX `wallet_transactions_type_idx`(`type`),
    INDEX `wallet_transactions_status_idx`(`status`),
    INDEX `wallet_transactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turnover_pool` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `totalAmount` INTEGER NOT NULL DEFAULT 0,
    `l1Amount` INTEGER NOT NULL DEFAULT 0,
    `l2Amount` INTEGER NOT NULL DEFAULT 0,
    `l3Amount` INTEGER NOT NULL DEFAULT 0,
    `l4Amount` INTEGER NOT NULL DEFAULT 0,
    `l5Amount` INTEGER NOT NULL DEFAULT 0,
    `distributed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `distributedAt` DATETIME(3) NULL,

    INDEX `turnover_pool_distributed_idx`(`distributed`),
    INDEX `turnover_pool_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_distributions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `level` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `poolId` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pool_distributions_userId_idx`(`userId`),
    INDEX `pool_distributions_level_idx`(`level`),
    INDEX `pool_distributions_poolId_idx`(`poolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `self_income_installments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `purchaseId` INTEGER UNSIGNED NOT NULL,
    `amount` INTEGER NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `dueDate` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `self_income_installments_userId_idx`(`userId`),
    INDEX `self_income_installments_status_idx`(`status`),
    INDEX `self_income_installments_dueDate_idx`(`dueDate`),
    INDEX `self_income_installments_purchaseId_fkey`(`purchaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `new_withdrawals` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `amount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'requested',
    `bankDetails` TEXT NULL,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `new_withdrawals_userId_idx`(`userId`),
    INDEX `new_withdrawals_status_idx`(`status`),
    INDEX `new_withdrawals_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `teamSize` INTEGER NOT NULL DEFAULT 0,
    `isComplete` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `teams_userId_idx`(`userId`),
    INDEX `teams_isComplete_idx`(`isComplete`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_members` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `teamId` INTEGER UNSIGNED NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `team_members_teamId_idx`(`teamId`),
    INDEX `team_members_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_distributions` ADD CONSTRAINT `pool_distributions_poolId_fkey` FOREIGN KEY (`poolId`) REFERENCES `turnover_pool`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_distributions` ADD CONSTRAINT `pool_distributions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_income_installments` ADD CONSTRAINT `self_income_installments_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_income_installments` ADD CONSTRAINT `self_income_installments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `new_withdrawals` ADD CONSTRAINT `new_withdrawals_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

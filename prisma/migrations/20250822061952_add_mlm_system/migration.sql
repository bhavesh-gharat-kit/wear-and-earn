/*
  Warnings:

  - A unique constraint covering the columns `[gatewayOrderId]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referralCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `gatewayOrderId` VARCHAR(191) NULL,
    ADD COLUMN `isJoiningOrder` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paidAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `commissionAmount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isEligibleRepurchase` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isKycApproved` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastMonthPurchase` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `monthlyPurchase` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `referralCode` VARCHAR(191) NULL,
    ADD COLUMN `walletBalance` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `matrix_nodes` (
    `userId` INTEGER UNSIGNED NOT NULL,
    `parentId` INTEGER UNSIGNED NULL,
    `position` INTEGER NULL,

    INDEX `matrix_nodes_parentId_idx`(`parentId`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hierarchy` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `ancestorId` INTEGER UNSIGNED NOT NULL,
    `descendantId` INTEGER UNSIGNED NOT NULL,
    `depth` INTEGER NOT NULL,

    INDEX `hierarchy_descendantId_depth_idx`(`descendantId`, `depth`),
    INDEX `hierarchy_ancestorId_depth_idx`(`ancestorId`, `depth`),
    UNIQUE INDEX `hierarchy_ancestorId_descendantId_key`(`ancestorId`, `descendantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NULL,
    `type` VARCHAR(191) NOT NULL,
    `ref` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `levelDepth` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ledger_userId_type_idx`(`userId`, `type`),
    INDEX `ledger_ref_idx`(`ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `self_payout_schedule` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `orderId` INTEGER UNSIGNED NOT NULL,
    `amount` INTEGER NOT NULL,
    `dueAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `self_payout_schedule_userId_status_idx`(`userId`, `status`),
    INDEX `self_payout_schedule_dueAt_status_idx`(`dueAt`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `order_gatewayOrderId_key` ON `order`(`gatewayOrderId`);

-- CreateIndex
CREATE INDEX `order_gatewayOrderId_idx` ON `order`(`gatewayOrderId`);

-- CreateIndex
CREATE INDEX `order_status_idx` ON `order`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `users_referralCode_key` ON `users`(`referralCode`);

-- CreateIndex
CREATE INDEX `users_referralCode_idx` ON `users`(`referralCode`);

-- CreateIndex
CREATE INDEX `users_isActive_idx` ON `users`(`isActive`);

-- AddForeignKey
ALTER TABLE `matrix_nodes` ADD CONSTRAINT `matrix_nodes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matrix_nodes` ADD CONSTRAINT `matrix_nodes_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `matrix_nodes`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hierarchy` ADD CONSTRAINT `hierarchy_ancestorId_fkey` FOREIGN KEY (`ancestorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hierarchy` ADD CONSTRAINT `hierarchy_descendantId_fkey` FOREIGN KEY (`descendantId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger` ADD CONSTRAINT `ledger_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_payout_schedule` ADD CONSTRAINT `self_payout_schedule_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

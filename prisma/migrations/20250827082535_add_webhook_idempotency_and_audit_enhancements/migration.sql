/*
  Warnings:

  - A unique constraint covering the columns `[ref]` on the table `ledger` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ledger` ADD COLUMN `balanceAfter` INTEGER NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `referenceId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `self_payout_schedule` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `ref` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `KycData` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `fatherName` VARCHAR(191) NULL,
    `aadharNumber` VARCHAR(191) NOT NULL,
    `panNumber` VARCHAR(191) NOT NULL,
    `bankAccountNumber` VARCHAR(191) NOT NULL,
    `ifscCode` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `nomineeName` VARCHAR(191) NULL,
    `nomineeRelation` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KycData_userId_key`(`userId`),
    INDEX `KycData_userId_idx`(`userId`),
    INDEX `KycData_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `withdrawal_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `amount` DOUBLE NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processedBy` INTEGER UNSIGNED NULL,
    `adminNotes` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `withdrawal_requests_userId_idx`(`userId`),
    INDEX `withdrawal_requests_status_idx`(`status`),
    INDEX `withdrawal_requests_requestedAt_idx`(`requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `webhookId` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payload` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `webhook_logs_webhookId_key`(`webhookId`),
    INDEX `webhook_logs_webhookId_idx`(`webhookId`),
    INDEX `webhook_logs_event_idx`(`event`),
    INDEX `webhook_logs_processedAt_idx`(`processedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ledger_ref_key` ON `ledger`(`ref`);

-- CreateIndex
CREATE INDEX `ledger_referenceId_idx` ON `ledger`(`referenceId`);

-- CreateIndex
CREATE INDEX `self_payout_schedule_ref_idx` ON `self_payout_schedule`(`ref`);

-- AddForeignKey
ALTER TABLE `KycData` ADD CONSTRAINT `KycData_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_processedBy_fkey` FOREIGN KEY (`processedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `amount` on the `pool_distributions` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `pool_distributions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `pool_distributions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `isComplete` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `teamSize` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `isKycApproved` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `kycStatusEnum` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `kycStatus` on the `users` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(5))`.
  - Added the required column `teamLeaderId` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `pool_distributions` DROP FOREIGN KEY `pool_distributions_userId_fkey`;

-- DropForeignKey
ALTER TABLE `teams` DROP FOREIGN KEY `teams_userId_fkey`;

-- DropIndex
DROP INDEX `pool_distributions_level_idx` ON `pool_distributions`;

-- DropIndex
DROP INDEX `pool_distributions_userId_idx` ON `pool_distributions`;

-- DropIndex
DROP INDEX `teams_isComplete_idx` ON `teams`;

-- DropIndex
DROP INDEX `teams_userId_idx` ON `teams`;

-- AlterTable
ALTER TABLE `pool_distributions` DROP COLUMN `amount`,
    DROP COLUMN `level`,
    DROP COLUMN `userId`,
    ADD COLUMN `adminId` INTEGER UNSIGNED NULL,
    ADD COLUMN `distributedAt` DATETIME(3) NULL,
    ADD COLUMN `distributionType` VARCHAR(191) NOT NULL DEFAULT 'POOL_PLAN',
    ADD COLUMN `l1Amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `l1UserCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `l2Amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `l2UserCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `l3Amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `l3UserCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `l4Amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `l4UserCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `l5Amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `l5UserCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `totalAmount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `purchases` ADD COLUMN `companyShareAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `mlmPriceAtTime` DOUBLE NULL,
    ADD COLUMN `poolContributionAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `selfIncomeAmount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `teams` DROP COLUMN `createdAt`,
    DROP COLUMN `isComplete`,
    DROP COLUMN `teamSize`,
    DROP COLUMN `userId`,
    ADD COLUMN `formationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `member1Id` INTEGER UNSIGNED NULL,
    ADD COLUMN `member2Id` INTEGER UNSIGNED NULL,
    ADD COLUMN `member3Id` INTEGER UNSIGNED NULL,
    ADD COLUMN `status` ENUM('FORMING', 'COMPLETE', 'DISBANDED') NOT NULL DEFAULT 'FORMING',
    ADD COLUMN `teamLeaderId` INTEGER UNSIGNED NOT NULL,
    ADD COLUMN `teamSequenceNumber` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `isKycApproved`,
    DROP COLUMN `kycStatusEnum`,
    ADD COLUMN `totalTeams` INTEGER NOT NULL DEFAULT 0,
    MODIFY `kycStatus` ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `self_income_payments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `purchaseId` INTEGER UNSIGNED NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `dueDate` DATETIME(3) NOT NULL,
    `paidDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `adminId` INTEGER UNSIGNED NULL,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `self_income_payments_userId_idx`(`userId`),
    INDEX `self_income_payments_purchaseId_idx`(`purchaseId`),
    INDEX `self_income_payments_status_idx`(`status`),
    INDEX `self_income_payments_dueDate_idx`(`dueDate`),
    INDEX `self_income_payments_weekNumber_idx`(`weekNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_transactions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `purchaseId` INTEGER UNSIGNED NOT NULL,
    `amountToPool` DOUBLE NOT NULL DEFAULT 0,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `purchaseType` VARCHAR(191) NOT NULL DEFAULT 'first',
    `productId` INTEGER UNSIGNED NOT NULL,
    `mlmPriceAtTime` DOUBLE NOT NULL DEFAULT 0,
    `poolContributed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pool_transactions_userId_idx`(`userId`),
    INDEX `pool_transactions_purchaseId_idx`(`purchaseId`),
    INDEX `pool_transactions_purchaseType_idx`(`purchaseType`),
    INDEX `pool_transactions_transactionDate_idx`(`transactionDate`),
    INDEX `pool_transactions_poolContributed_idx`(`poolContributed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referral_tracking` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `referrerId` INTEGER UNSIGNED NOT NULL,
    `referredUserId` INTEGER UNSIGNED NOT NULL,
    `referralDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `firstPurchaseCompleted` BOOLEAN NOT NULL DEFAULT false,
    `teamContributionStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `referralCodeUsed` VARCHAR(191) NULL,
    `firstPurchaseId` INTEGER UNSIGNED NULL,
    `firstPurchaseDate` DATETIME(3) NULL,
    `teamFormationTriggered` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `referral_tracking_referrerId_idx`(`referrerId`),
    INDEX `referral_tracking_referredUserId_idx`(`referredUserId`),
    INDEX `referral_tracking_firstPurchaseCompleted_idx`(`firstPurchaseCompleted`),
    INDEX `referral_tracking_teamContributionStatus_idx`(`teamContributionStatus`),
    INDEX `referral_tracking_referralDate_idx`(`referralDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kyc_submissions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `submissionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `documentUrls` JSON NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `adminComments` TEXT NULL,
    `reviewedByAdminId` INTEGER UNSIGNED NULL,
    `reviewedDate` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `resubmissionCount` INTEGER NOT NULL DEFAULT 0,
    `documentType` VARCHAR(191) NULL,
    `verificationNotes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kyc_submissions_userId_idx`(`userId`),
    INDEX `kyc_submissions_status_idx`(`status`),
    INDEX `kyc_submissions_submissionDate_idx`(`submissionDate`),
    INDEX `kyc_submissions_reviewedByAdminId_idx`(`reviewedByAdminId`),
    INDEX `kyc_submissions_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `pool_distributions_status_idx` ON `pool_distributions`(`status`);

-- CreateIndex
CREATE INDEX `pool_distributions_distributionType_idx` ON `pool_distributions`(`distributionType`);

-- CreateIndex
CREATE INDEX `pool_distributions_createdAt_idx` ON `pool_distributions`(`createdAt`);

-- CreateIndex
CREATE INDEX `teams_teamLeaderId_idx` ON `teams`(`teamLeaderId`);

-- CreateIndex
CREATE INDEX `teams_status_idx` ON `teams`(`status`);

-- CreateIndex
CREATE INDEX `teams_formationDate_idx` ON `teams`(`formationDate`);

-- CreateIndex
CREATE INDEX `teams_teamSequenceNumber_idx` ON `teams`(`teamSequenceNumber`);

-- AddForeignKey
ALTER TABLE `pool_distributions` ADD CONSTRAINT `pool_distributions_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_teamLeaderId_fkey` FOREIGN KEY (`teamLeaderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_member1Id_fkey` FOREIGN KEY (`member1Id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_member2Id_fkey` FOREIGN KEY (`member2Id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_member3Id_fkey` FOREIGN KEY (`member3Id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_income_payments` ADD CONSTRAINT `self_income_payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_income_payments` ADD CONSTRAINT `self_income_payments_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_income_payments` ADD CONSTRAINT `self_income_payments_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_transactions` ADD CONSTRAINT `pool_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_transactions` ADD CONSTRAINT `pool_transactions_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_transactions` ADD CONSTRAINT `pool_transactions_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_tracking` ADD CONSTRAINT `referral_tracking_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_tracking` ADD CONSTRAINT `referral_tracking_referredUserId_fkey` FOREIGN KEY (`referredUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_tracking` ADD CONSTRAINT `referral_tracking_firstPurchaseId_fkey` FOREIGN KEY (`firstPurchaseId`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_submissions` ADD CONSTRAINT `kyc_submissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_submissions` ADD CONSTRAINT `kyc_submissions_reviewedByAdminId_fkey` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

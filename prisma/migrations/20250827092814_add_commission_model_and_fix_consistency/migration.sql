-- AlterTable
ALTER TABLE `order` MODIFY `commissionAmount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `commissions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `fromUserId` INTEGER UNSIGNED NOT NULL,
    `orderId` INTEGER UNSIGNED NULL,
    `amount` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isEligible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commissions_userId_type_idx`(`userId`, `type`),
    INDEX `commissions_fromUserId_idx`(`fromUserId`),
    INDEX `commissions_orderId_idx`(`orderId`),
    INDEX `commissions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

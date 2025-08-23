-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `sponsorId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobileNo` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL DEFAULT 'user',
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isVerified` VARCHAR(191) NOT NULL DEFAULT 'no',
    `verifyCode` VARCHAR(191) NULL,
    `verifyCodeExpiry` DATETIME(3) NULL,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `address` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_mobileNo_key`(`mobileNo`),
    INDEX `User_sponsorId_fkey`(`sponsorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

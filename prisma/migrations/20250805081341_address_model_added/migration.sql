/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `sponsorId` INTEGER UNSIGNED NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `mobileNo` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL DEFAULT 'user',
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifyCode` VARCHAR(191) NULL,
    `verifyCodeExpiry` DATETIME(3) NULL,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_mobileNo_key`(`mobileNo`),
    INDEX `users_sponsorId_fkey`(`sponsorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `address` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NOT NULL,
    `houseNumber` VARCHAR(191) NULL,
    `area` VARCHAR(191) NOT NULL,
    `landmark` VARCHAR(191) NULL,
    `villageOrCity` VARCHAR(191) NOT NULL,
    `taluka` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `pinCode` INTEGER NOT NULL,
    `state` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `address_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `longDescription` TEXT NOT NULL,
    `inStock` INTEGER NOT NULL DEFAULT 1,
    `categoryId` INTEGER UNSIGNED NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `discount` DOUBLE NULL,
    `profit` DOUBLE NULL,
    `gst` DOUBLE NULL,
    `gatewayFee` DOUBLE NULL,
    `homeDelivery` DOUBLE NULL,
    `price` DOUBLE NOT NULL,
    `sellingPrice` DOUBLE NOT NULL,
    `mainImage` VARCHAR(191) NULL,
    `manufacturer` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Product_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productimages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `productId` INTEGER UNSIGNED NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,

    INDEX `productimages_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `productId` INTEGER UNSIGNED NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    INDEX `cart_productId_fkey`(`productId`),
    INDEX `cart_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INTEGER UNSIGNED NULL,
    `deliveryman` VARCHAR(191) NULL,
    `paymentId` VARCHAR(191) NULL,
    `total` DOUBLE NOT NULL,
    `deliveryCharges` DOUBLE NOT NULL DEFAULT 0,
    `commissionAmount` DOUBLE NOT NULL,
    `gstAmount` DOUBLE NOT NULL,
    `address` TEXT NOT NULL,
    `orderNotice` VARCHAR(191) NULL,
    `status` ENUM('inProcess', 'pending', 'delivered') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deliveredAt` DATETIME(3) NULL,

    INDEX `order_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orderproducts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER UNSIGNED NOT NULL,
    `productId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `sellingPrice` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL,
    `gst` DOUBLE NOT NULL,
    `finalMRP` DOUBLE NOT NULL,
    `homeDelivery` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,

    INDEX `orderproducts_orderId_fkey`(`orderId`),
    INDEX `orderproducts_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `address` ADD CONSTRAINT `address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productimages` ADD CONSTRAINT `productimages_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderproducts` ADD CONSTRAINT `orderproducts_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

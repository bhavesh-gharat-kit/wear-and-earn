// CREATE MLM TEST USERS WITH TEAM HIERARCHY
// This script creates users with Level 1, Level 2, and Level 3 team structures

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createMLMTestUsers() {
  try {
    console.log('🏗️ CREATING MLM TEST USERS WITH TEAM HIERARCHY\n');

    // Hash password for all test users
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create main user (the one you'll login as to see teams)
    console.log('👤 Creating Main User...');
    const mainUser = await prisma.user.create({
      data: {
        fullName: 'Main Test User',
        email: 'mainuser@test.com',
        mobileNo: '9999999999',
        password: hashedPassword,
        isVerified: true,
        referralCode: 'MAIN001',
        kycStatus: 'APPROVED',
        walletBalance: 50000, // ₹500 balance in paisa
      }
    });
    console.log(`✅ Main User created: ${mainUser.name} (ID: ${mainUser.id})`);

    // Create Level 1 team members (direct referrals)
    console.log('\n👥 Creating Level 1 Team Members...');
    const level1Users = [];
    
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          fullName: `Level 1 User ${i}`,
          email: `level1user${i}@test.com`,
          mobileNo: `9999999${i.toString().padStart(3, '0')}`,
          password: hashedPassword,
          isVerified: true,
          referralCode: `L1U${i.toString().padStart(3, '0')}`,
          sponsorId: mainUser.id,
          kycStatus: i <= 3 ? 'APPROVED' : 'PENDING', // Mix of KYC statuses
          walletBalance: Math.floor(Math.random() * 10000) + 1000, // Random balance
        }
      });
      level1Users.push(user);
      console.log(`  ✅ ${user.fullName} (ID: ${user.id}) - KYC: ${user.kycStatus}`);
    }

    // Create Level 2 team members (referrals of Level 1 users)
    console.log('\n👥👥 Creating Level 2 Team Members...');
    const level2Users = [];
    
    for (const l1User of level1Users.slice(0, 3)) { // Only first 3 L1 users have referrals
      for (let i = 1; i <= 3; i++) {
        const user = await prisma.user.create({
          data: {
            fullName: `Level 2 User ${l1User.fullName.slice(-1)}.${i}`,
            email: `level2user${l1User.id}${i}@test.com`,
            mobileNo: `9999${l1User.id}${i.toString().padStart(2, '0')}`,
            password: hashedPassword,
            isVerified: true,
            referralCode: `L2U${l1User.id}${i}`,
            sponsorId: l1User.id,
            kycStatus: Math.random() > 0.3 ? 'APPROVED' : 'PENDING',
            walletBalance: Math.floor(Math.random() * 5000) + 500,
          }
        });
        level2Users.push(user);
        console.log(`  ✅ ${user.fullName} (ID: ${user.id}) - Referred by: ${l1User.fullName}`);
      }
    }

    // Create Level 3 team members (referrals of Level 2 users)
    console.log('\n👥👥👥 Creating Level 3 Team Members...');
    const level3Users = [];
    
    for (const l2User of level2Users.slice(0, 4)) { // Only first 4 L2 users have referrals
      for (let i = 1; i <= 2; i++) {
        const user = await prisma.user.create({
          data: {
            fullName: `Level 3 User ${l2User.fullName.slice(-3)}.${i}`,
            email: `level3user${l2User.id}${i}@test.com`,
            mobileNo: `999${l2User.id}${i.toString().padStart(3, '0')}`,
            password: hashedPassword,
            isVerified: true,
            referralCode: `L3U${l2User.id}${i}`,
            sponsorId: l2User.id,
            kycStatus: Math.random() > 0.4 ? 'APPROVED' : 'PENDING',
            walletBalance: Math.floor(Math.random() * 3000) + 200,
          }
        });
        level3Users.push(user);
        console.log(`  ✅ ${user.fullName} (ID: ${user.id}) - Referred by: ${l2User.fullName}`);
      }
    }

    // Create some orders for these users to generate commission data
    console.log('\n🛒 Creating Sample Orders for Commission Tracking...');
    
    // Get a product to use for orders
    const product = await prisma.product.findFirst({
      where: { mlmPrice: { not: null } }
    });

    if (product) {
      // Create orders for some Level 1 users
      for (const user of level1Users.slice(0, 3)) {
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            total: product.sellingPrice,
            deliveryCharges: 0,
            commissionAmount: product.mlmPrice * 100, // in paisa
            gstAmount: product.sellingPrice * 0.18, // 18% GST
            address: "Test Address, Test City, Test State - 123456",
            status: 'delivered',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            deliveredAt: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000),
          }
        });

        await prisma.orderProducts.create({
          data: {
            orderId: order.id,
            productId: product.id,
            title: product.title,
            quantity: 1,
            sellingPrice: product.sellingPrice,
            discount: product.discount || 0,
            gst: product.sellingPrice * 0.18,
            finalMRP: product.sellingPrice,
            homeDelivery: 0,
            totalPrice: product.sellingPrice,
          }
        });

        console.log(`  📦 Order created for ${user.fullName} - Amount: ₹${product.sellingPrice}`);
      }

      // Create orders for some Level 2 users
      for (const user of level2Users.slice(0, 2)) {
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            total: product.sellingPrice,
            deliveryCharges: 0,
            commissionAmount: product.mlmPrice * 100,
            gstAmount: product.sellingPrice * 0.18,
            address: "Test Address, Test City, Test State - 123456",
            status: 'delivered',
            createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
            deliveredAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
          }
        });

        await prisma.orderProducts.create({
          data: {
            orderId: order.id,
            productId: product.id,
            title: product.title,
            quantity: 1,
            sellingPrice: product.sellingPrice,
            discount: product.discount || 0,
            gst: product.sellingPrice * 0.18,
            finalMRP: product.sellingPrice,
            homeDelivery: 0,
            totalPrice: product.sellingPrice,
          }
        });

        console.log(`  📦 Order created for ${user.fullName} - Amount: ₹${product.sellingPrice}`);
      }
    }

    // Add some referral tracking entries
    console.log('\n💰 Creating Referral Tracking Entries...');
    
    // Level 1 referral tracking (direct referrals)
    for (const l1User of level1Users) {
      await prisma.referralTracking.create({
        data: {
          referrerId: mainUser.id,
          referredUserId: l1User.id,
          referralCodeUsed: mainUser.referralCode,
          firstPurchaseCompleted: Math.random() > 0.3, // Some have completed first purchase
          teamContributionStatus: 'active',
          referralDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        }
      });
    }

    // Level 2 referral tracking
    for (let i = 0; i < level2Users.length; i++) {
      const l2User = level2Users[i];
      const referrerIndex = Math.floor(i / 3); // Each L1 user refers 3 L2 users
      const referrer = level1Users[referrerIndex];
      
      await prisma.referralTracking.create({
        data: {
          referrerId: referrer.id,
          referredUserId: l2User.id,
          referralCodeUsed: referrer.referralCode,
          firstPurchaseCompleted: Math.random() > 0.4,
          teamContributionStatus: 'active',
          referralDate: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000),
        }
      });
    }

    // Level 3 referral tracking
    for (let i = 0; i < level3Users.length; i++) {
      const l3User = level3Users[i];
      const referrerIndex = Math.floor(i / 2); // Each L2 user refers 2 L3 users
      const referrer = level2Users[referrerIndex];
      
      await prisma.referralTracking.create({
        data: {
          referrerId: referrer.id,
          referredUserId: l3User.id,
          referralCodeUsed: referrer.referralCode,
          firstPurchaseCompleted: Math.random() > 0.5,
          teamContributionStatus: 'active',
          referralDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
        }
      });
    }

    console.log('✅ Referral tracking entries created successfully!');

    // Summary
    console.log('\n📊 SUMMARY OF CREATED TEST DATA:');
    console.log(`👤 Main User: ${mainUser.fullName} (${mainUser.email})`);
    console.log(`   Password: test123`);
    console.log(`   Referral Code: ${mainUser.referralCode}`);
    console.log(`\n👥 Team Structure:`);
    console.log(`   Level 1: ${level1Users.length} users`);
    console.log(`   Level 2: ${level2Users.length} users`);
    console.log(`   Level 3: ${level3Users.length} users`);
    console.log(`   Total Team Size: ${level1Users.length + level2Users.length + level3Users.length} users`);

    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('Email: mainuser@test.com');
    console.log('Password: test123');
    console.log('\n✅ You can now login and check the MLM team structure in the frontend!');

  } catch (error) {
    console.error('❌ Error creating MLM test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMLMTestUsers();
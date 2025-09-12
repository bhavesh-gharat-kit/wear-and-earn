import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReferralCodeGeneration() {
  try {
    console.log('🧪 Testing referral code generation after first purchase...');
    
    // Find a user without referral code
    const userWithoutCode = await prisma.user.findFirst({
      where: {
        referralCode: null,
        isActive: false
      },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        isActive: true
      }
    });
    
    if (!userWithoutCode) {
      console.log('📋 No users found without referral code. Creating test user...');
      
      // Create test user
      const testUser = await prisma.user.create({
        data: {
          fullName: 'Test Referral User',
          mobileNo: `TEST${Date.now()}`,
          password: 'hashed_password',
          isActive: false,
          referralCode: null
        }
      });
      
      console.log('✅ Test user created:', testUser);
      
      // Test referral code generation
      await testGenerationForUser(testUser.id);
      
      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('🧹 Test user cleaned up');
      
    } else {
      console.log('👤 Found user without referral code:', userWithoutCode);
      await testGenerationForUser(userWithoutCode.id);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    //await prisma.$disconnect();
  }
}

async function testGenerationForUser(userId) {
  console.log(`\n🎟️ Testing referral code generation for user ${userId}...`);
  
  try {
    // Import the pool MLM system
    const { processPoolMLMOrder } = await import('./lib/pool-mlm-system.js');
    
    // Create a mock order to test the generation
    const mockOrder = {
      id: 999999,
      userId: userId,
      total: 100000, // 1000 INR in paisa
      orderProducts: [
        {
          productId: 1,
          quantity: 1,
          totalPrice: 100000,
          mlmPrice: 10000
        }
      ]
    };
    
    // Test in transaction
    await prisma.$transaction(async (tx) => {
      console.log('📦 Running Pool MLM processing...');
      const result = await processPoolMLMOrder(tx, mockOrder);
      console.log('✅ Pool MLM result:', result);
      
      // Check if referral code was generated
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          referralCode: true,
          isActive: true
        }
      });
      
      console.log('🎯 User after processing:', updatedUser);
      
      if (updatedUser.referralCode) {
        console.log('🎉 SUCCESS: Referral code generated!', updatedUser.referralCode);
      } else {
        console.log('❌ FAILED: Referral code not generated');
      }
      
      // Don't actually save the changes - this is just a test
      throw new Error('Rollback test transaction');
    });
    
  } catch (error) {
    if (error.message === 'Rollback test transaction') {
      console.log('✅ Test transaction rolled back (as expected)');
    } else {
      console.error('❌ Error during test:', error);
    }
  }
}

// Run the test
testReferralCodeGeneration();

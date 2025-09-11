#!/usr/bin/env node

console.log('🔬 TESTING REFERRAL CODE GENERATION AFTER FIRST PURCHASE');
console.log('=======================================================');

async function testReferralCodeGeneration() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
        console.log('\n1. Checking database for users without referral codes...');
        
        // Find users without referral codes
        const usersWithoutCode = await prisma.user.findMany({
            where: { 
                referralCode: null,
                role: 'user' // Exclude admin users
            },
            select: { 
                id: true, 
                fullName: true, 
                email: true, 
                isActive: true 
            }
        });

        console.log(`📊 Found ${usersWithoutCode.length} users without referral codes:`);
        usersWithoutCode.forEach(user => {
            console.log(`   - ${user.fullName} (ID: ${user.id}, Active: ${user.isActive})`);
        });

        if (usersWithoutCode.length === 0) {
            console.log('✅ All users already have referral codes!');
            return;
        }

        console.log('\n2. Testing referral code generation function...');
        
        // Import the function
        const { generateAndAssignReferralCode } = await import('./lib/referral.js');
        
        const testUser = usersWithoutCode[0];
        console.log(`🧪 Testing with user: ${testUser.fullName} (ID: ${testUser.id})`);
        
        // Generate referral code
        const newCode = await generateAndAssignReferralCode(prisma, testUser.id);
        console.log(`✅ Generated referral code: ${newCode}`);
        
        // Verify it was saved
        const updatedUser = await prisma.user.findUnique({
            where: { id: testUser.id },
            select: { referralCode: true, isActive: true }
        });
        
        console.log(`🔍 Verification - Code in database: ${updatedUser.referralCode}`);
        console.log(`🔍 Verification - User active: ${updatedUser.isActive}`);
        
        if (updatedUser.referralCode === newCode) {
            console.log('✅ Referral code successfully saved to database!');
        } else {
            console.log('❌ Referral code NOT saved to database!');
        }

        console.log('\n3. Checking for purchases by users without referral codes...');
        
        // Check if any users have made purchases but don't have referral codes
        const purchasedUsers = await prisma.user.findMany({
            where: {
                referralCode: null,
                role: 'user',
                // Find users who have made purchases
                orders: {
                    some: {
                        status: { in: ['delivered', 'inProcess'] } // Valid statuses that indicate payment success
                    }
                }
            },
            include: {
                orders: {
                    where: {
                        status: { in: ['delivered', 'inProcess'] }
                    },
                    orderBy: { createdAt: 'asc' },
                    take: 1 // Get their first order
                }
            }
        });

        console.log(`🛒 Found ${purchasedUsers.length} users who made purchases but have no referral code:`);
        purchasedUsers.forEach(user => {
            const firstOrder = user.orders[0];
            console.log(`   - ${user.fullName} (ID: ${user.id}) - First order: ${firstOrder?.id} on ${firstOrder?.createdAt?.toDateString()}`);
        });

        if (purchasedUsers.length > 0) {
            console.log('\n⚠️ ISSUE FOUND: Users made purchases but no referral codes generated!');
            console.log('This indicates the MLM processing might not be working correctly.');
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
await testReferralCodeGeneration();
console.log('\n🏁 Test completed!');

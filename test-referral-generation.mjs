#!/usr/bin/env node

console.log('🧪 TESTING REFERRAL CODE GENERATION AFTER FIRST PURCHASE');
console.log('========================================================');

async function testReferralCodeGeneration() {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // 1. Find a user without referral code
        const userWithoutCode = await prisma.user.findFirst({
            where: { 
                referralCode: null,
                isActive: false
            },
            select: { id: true, fullName: true, referralCode: true, isActive: true }
        });

        if (!userWithoutCode) {
            console.log('❌ No user found without referral code. Creating test user...');
            
            const testUser = await prisma.user.create({
                data: {
                    fullName: 'Test User for Referral',
                    mobileNo: 'test_referral_123',
                    password: 'hashedpassword',
                    isActive: false,
                    kycStatus: 'PENDING',
                    walletBalance: 0,
                    monthlyPurchase: 0,
                    isEligibleRepurchase: false
                }
            });
            
            console.log('✅ Created test user:', testUser.id);
            
            // Now test referral code generation
            console.log('2. Testing referral code generation...');
            
            const { generateAndAssignReferralCode } = await import('./lib/referral.js');
            
            const referralCode = await generateAndAssignReferralCode(prisma, testUser.id);
            console.log('✅ Referral code generated:', referralCode);
            
            // Verify in database
            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id },
                select: { referralCode: true, isActive: true }
            });
            
            console.log('📊 User after referral code generation:', updatedUser);
            
            // Cleanup test user
            await prisma.user.delete({ where: { id: testUser.id } });
            console.log('🧹 Test user cleaned up');
            
        } else {
            console.log('✅ Found user without referral code:', {
                id: userWithoutCode.id,
                name: userWithoutCode.fullName,
                referralCode: userWithoutCode.referralCode,
                isActive: userWithoutCode.isActive
            });
            
            // Test referral code generation
            console.log('2. Testing referral code generation...');
            
            const { generateAndAssignReferralCode } = await import('./lib/referral.js');
            
            const referralCode = await generateAndAssignReferralCode(prisma, userWithoutCode.id);
            console.log('✅ Referral code generated:', referralCode);
            
            // Verify in database
            const updatedUser = await prisma.user.findUnique({
                where: { id: userWithoutCode.id },
                select: { referralCode: true, isActive: true }
            });
            
            console.log('📊 User after referral code generation:', updatedUser);
        }

        // 3. Test if referral API works
        console.log('3. Testing referral API functionality...');
        
        const activeUsers = await prisma.user.findMany({
            where: { 
                referralCode: { not: null },
                isActive: true 
            },
            select: { id: true, referralCode: true, fullName: true },
            take: 3
        });
        
        console.log('📋 Active users with referral codes:', activeUsers);

        await prisma.$disconnect();
        console.log('🏁 Test completed!');

    } catch (error) {
        console.error('❌ Error testing referral code generation:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run test
await testReferralCodeGeneration();

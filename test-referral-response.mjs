#!/usr/bin/env node

console.log('🧪 TESTING PAYMENT VERIFICATION RESPONSE');
console.log('=======================================');

async function testPaymentVerification() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
        console.log('\n1. Checking current user status...');
        
        const testUser = await prisma.user.findUnique({
            where: { id: 4 }, // test1 user
            select: {
                id: true,
                fullName: true,
                referralCode: true,
                isActive: true
            }
        });

        if (testUser) {
            console.log(`✅ User ${testUser.fullName}:`);
            console.log(`   - ID: ${testUser.id}`);
            console.log(`   - Referral Code: ${testUser.referralCode || 'NONE'}`);
            console.log(`   - Active: ${testUser.isActive}`);
        }

        console.log('\n2. Checking /api/account/referral API response...');
        
        // Simulate the API call that the frontend makes
        const response = await fetch('http://localhost:3000/api/account/referral', {
            headers: {
                'cookie': `next-auth.session-token=test-session-for-user-4` // This won't work but let's see
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response:', data);
        } else {
            console.log('❌ API Error:', response.status, response.statusText);
        }

        console.log('\n3. Manual referral code check...');
        
        const allUsersWithCodes = await prisma.user.findMany({
            where: {
                referralCode: { not: null }
            },
            select: {
                id: true,
                fullName: true,
                referralCode: true,
                isActive: true
            }
        });

        console.log(`📊 Users with referral codes: ${allUsersWithCodes.length}`);
        allUsersWithCodes.forEach(user => {
            console.log(`   ✅ ${user.fullName}: ${user.referralCode} (Active: ${user.isActive})`);
        });

        console.log('\n🔧 Recommendations:');
        if (testUser?.referralCode) {
            console.log('✅ User has referral code - should show in frontend now');
            console.log('✅ Checkout notification should work correctly');
            console.log('✅ No more misleading "referral code generated" message');
        } else {
            console.log('❌ User still missing referral code - needs investigation');
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
await testPaymentVerification();
console.log('\n🏁 Test completed!');

#!/usr/bin/env node

console.log('🔧 EMERGENCY FIX: Generate Referral Code for Paid User');
console.log('==================================================');

async function emergencyFixReferralCode() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
        console.log('\n1. Finding users with paid orders but no referral codes...');
        
        // Find the specific user who paid but has no referral code
        const paidUsersWithoutCode = await prisma.user.findMany({
            where: {
                referralCode: null,
                role: 'user',
                orders: {
                    some: {
                        paidAt: { not: null }
                    }
                }
            },
            include: {
                orders: {
                    where: {
                        paidAt: { not: null }
                    },
                    take: 1
                }
            }
        });

        console.log(`🚨 Found ${paidUsersWithoutCode.length} users who paid but have no referral code:`);
        
        for (const user of paidUsersWithoutCode) {
            const firstOrder = user.orders[0];
            console.log(`   - ${user.fullName} (ID: ${user.id}) paid on ${firstOrder.paidAt.toDateString()}`);
            
            // Generate referral code directly
            const referralCode = `WE${user.id.toString().padStart(4, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            console.log(`   🎟️ Generating referral code: ${referralCode}`);
            
            // Update user with referral code and activate
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    referralCode: referralCode,
                    isActive: true
                },
                select: {
                    id: true,
                    fullName: true,
                    referralCode: true,
                    isActive: true
                }
            });

            console.log(`   ✅ Updated ${updatedUser.fullName}: Code=${updatedUser.referralCode}, Active=${updatedUser.isActive}`);
        }

        console.log('\n2. Verification - All users now:');
        
        const allUsers = await prisma.user.findMany({
            where: { role: 'user' },
            select: {
                id: true,
                fullName: true,
                referralCode: true,
                isActive: true
            },
            orderBy: { id: 'asc' }
        });

        allUsers.forEach(user => {
            const codeStatus = user.referralCode ? `✅ ${user.referralCode}` : '❌ NO CODE';
            console.log(`   ${user.fullName} - Active: ${user.isActive} - Code: ${codeStatus}`);
        });

        console.log('\n3. Checking notification message issue...');
        console.log('ℹ️  The notification saying "referral code generated" but no code exists is likely coming from:');
        console.log('   - Frontend checkout page showing success message');
        console.log('   - Should be updated to only show if referral code actually exists');
        
        const usersWithCodes = allUsers.filter(u => u.referralCode).length;
        const totalUsers = allUsers.length;
        
        console.log(`\n📊 Summary: ${usersWithCodes}/${totalUsers} users now have referral codes`);
        
        if (usersWithCodes === totalUsers) {
            console.log('✅ All users now have referral codes!');
        } else {
            console.log('⚠️  Some users still need referral codes (likely those who haven\'t purchased yet)');
        }

    } catch (error) {
        console.error('❌ Error during emergency fix:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the emergency fix
await emergencyFixReferralCode();
console.log('\n🏁 Emergency fix completed!');

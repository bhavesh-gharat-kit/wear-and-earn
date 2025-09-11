#!/usr/bin/env node

console.log('🔬 DEBUGGING REFERRAL CODE ISSUE');
console.log('================================');

async function debugReferralIssue() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
        console.log('\n1. Checking all users and their referral codes...');
        
        const allUsers = await prisma.user.findMany({
            select: { 
                id: true, 
                fullName: true, 
                email: true, 
                referralCode: true, 
                isActive: true,
                role: true 
            },
            orderBy: { id: 'asc' }
        });

        console.log(`📊 Total users: ${allUsers.length}`);
        allUsers.forEach(user => {
            const codeStatus = user.referralCode ? `✅ ${user.referralCode}` : '❌ NO CODE';
            console.log(`   ${user.id}. ${user.fullName} (${user.role}) - Active: ${user.isActive} - Code: ${codeStatus}`);
        });

        console.log('\n2. Checking orders and their payment status...');
        
        const orders = await prisma.order.findMany({
            select: {
                id: true,
                userId: true,
                status: true,
                paidAt: true,
                createdAt: true,
                user: {
                    select: {
                        fullName: true,
                        referralCode: true,
                        isActive: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📦 Total orders: ${orders.length}`);
        orders.forEach(order => {
            const userCode = order.user.referralCode ? `✅ ${order.user.referralCode}` : '❌ NO CODE';
            const paidStatus = order.paidAt ? `✅ Paid ${order.paidAt.toISOString().split('T')[0]}` : '❌ Not Paid';
            console.log(`   Order ${order.id} - User: ${order.user.fullName} - Status: ${order.status} - ${paidStatus} - Code: ${userCode}`);
        });

        console.log('\n3. Checking purchases table for MLM processing...');
        
        const purchases = await prisma.purchase.findMany({
            select: {
                id: true,
                userId: true,
                type: true,
                createdAt: true,
                user: {
                    select: {
                        fullName: true,
                        referralCode: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`💰 Total purchases (MLM records): ${purchases.length}`);
        purchases.forEach(purchase => {
            const userCode = purchase.user.referralCode ? `✅ ${purchase.user.referralCode}` : '❌ NO CODE';
            console.log(`   Purchase ${purchase.id} - User: ${purchase.user.fullName} - Type: ${purchase.type} - Code: ${userCode}`);
        });

        console.log('\n4. Key Issues Analysis...');
        
        // Find users with paid orders but no referral codes
        const problematicUsers = orders.filter(order => 
            order.paidAt && !order.user.referralCode && order.user.role !== 'admin'
        );

        if (problematicUsers.length > 0) {
            console.log('🚨 ISSUE FOUND: Users with paid orders but NO referral codes:');
            problematicUsers.forEach(order => {
                console.log(`   - ${order.user.fullName} (Order ${order.id}) paid on ${order.paidAt.toDateString()} but has NO referral code`);
            });
            
            console.log('\n📋 DIAGNOSIS:');
            console.log('   1. ❌ Payment verification API is NOT calling MLM processing correctly');
            console.log('   2. ❌ generateReferralCodeIfNeeded function is NOT being triggered');
            console.log('   3. ❌ Users are completing payments but MLM system is not activating');
            
        } else {
            console.log('✅ No issues found - all paid users have referral codes');
        }

        // Check if MLM is being processed at all
        if (purchases.length === 0 && orders.some(o => o.paidAt)) {
            console.log('\n🚨 CRITICAL ISSUE: No MLM purchase records found but paid orders exist!');
            console.log('   This means the MLM processing is completely broken.');
        }

    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the debug
await debugReferralIssue();
console.log('\n🏁 Debug completed!');

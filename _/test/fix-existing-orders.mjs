#!/usr/bin/env node

console.log('🔧 FIXING MLM PROCESSING FOR EXISTING PAID ORDERS');
console.log('=================================================');

async function fixExistingPaidOrders() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
        console.log('\n1. Finding paid orders without MLM processing...');
        
        // Get paid orders that don't have MLM processing
        const paidOrders = await prisma.order.findMany({
            where: {
                paidAt: { not: null }, // Order is paid
                status: { in: ['inProcess', 'delivered'] }, // Valid payment statuses
                user: {
                    role: 'user' // Exclude admin orders
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        referralCode: true,
                        isActive: true
                    }
                },
                orderProducts: {
                    select: {
                        id: true,
                        productId: true,
                        title: true,
                        quantity: true,
                        totalPrice: true
                    }
                }
            }
        });

        console.log(`📦 Found ${paidOrders.length} paid orders`);

        for (const order of paidOrders) {
            console.log(`\n📋 Processing Order ${order.id} for ${order.user.fullName}:`);
            
            // Check if MLM processing already exists
            const existingPurchases = await prisma.purchase.count({
                where: { orderId: order.id }
            });

            if (existingPurchases > 0) {
                console.log(`   ✅ MLM processing already exists (${existingPurchases} purchases)`);
                continue;
            }

            console.log(`   🔄 No MLM processing found - triggering now...`);

            try {
                // Process in transaction
                const result = await prisma.$transaction(async (tx) => {
                    console.log(`   📊 Processing MLM for order ${order.id}...`);
                    
                    // Enhance order with product data for MLM processing
                    const enhancedOrder = {
                        ...order,
                        orderProducts: await Promise.all(
                            order.orderProducts.map(async (op) => {
                                const product = await tx.product.findUnique({
                                    where: { id: op.productId },
                                    select: { id: true, mlmPrice: true, title: true }
                                });
                                return {
                                    ...op,
                                    product
                                };
                            })
                        )
                    };
                    
                    // Import and run MLM processing
                    const { processPoolMLMOrder } = await import('../../lib/pool-mlm-system.js');
                    const mlmResult = await processPoolMLMOrder(tx, enhancedOrder);
                    
                    console.log(`   ✅ MLM processing completed:`, {
                        totalMlmAmount: mlmResult.totalMlmAmount,
                        purchases: mlmResult.purchases?.length || 0
                    });

                    // Check if user got referral code
                    const updatedUser = await tx.user.findUnique({
                        where: { id: order.userId },
                        select: { referralCode: true, isActive: true }
                    });

                    console.log(`   🎟️ User after processing: Code=${updatedUser.referralCode}, Active=${updatedUser.isActive}`);
                    
                    return { mlmResult, updatedUser };
                });

                console.log(`   🎉 Successfully processed Order ${order.id}`);

            } catch (error) {
                console.error(`   ❌ Error processing Order ${order.id}:`, error.message);
                console.error(`   Stack:`, error.stack);
            }
        }

        console.log('\n2. Final verification - checking all users now...');
        
        const finalUsers = await prisma.user.findMany({
            where: { role: 'user' },
            select: { 
                id: true, 
                fullName: true, 
                referralCode: true, 
                isActive: true 
            }
        });

        console.log('📊 Final user status:');
        finalUsers.forEach(user => {
            const codeStatus = user.referralCode ? `✅ ${user.referralCode}` : '❌ NO CODE';
            console.log(`   ${user.fullName} - Active: ${user.isActive} - Code: ${codeStatus}`);
        });

        // Check final purchase count
        const finalPurchaseCount = await prisma.purchase.count();
        console.log(`\n💰 Total MLM purchases in database: ${finalPurchaseCount}`);

        if (finalPurchaseCount > 0) {
            console.log('✅ MLM processing is now working!');
        } else {
            console.log('❌ MLM processing still not working - deeper investigation needed');
        }

    } catch (error) {
        console.error('❌ Error during fix:', error);
        console.error('Stack:', error.stack);
    } finally {
        //await prisma.$disconnect();
    }
}

// Run the fix
await fixExistingPaidOrders();
console.log('\n🏁 Fix completed!');

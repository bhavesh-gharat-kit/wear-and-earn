/**
 * Check for any existing pending orders in the system
 */

const { PrismaClient } = require('@prisma/client');

async function checkExistingPendingOrders() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Existing Pending Orders\n');
    
    // Get all pending orders
    const pendingOrders = await prisma.order.findMany({
      where: { 
        status: 'pending',
        paidAt: null
      },
      include: {
        user: { select: { email: true } },
        orderProducts: { select: { title: true, quantity: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📋 Total pending orders in system: ${pendingOrders.length}`);
    
    if (pendingOrders.length > 0) {
      console.log('\n🚨 Existing pending orders found:');
      pendingOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order #${order.id}`);
        console.log(`   User: ${order.user.email}`);
        console.log(`   Amount: ₹${order.total / 100}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Products: ${order.orderProducts.length} items`);
        order.orderProducts.forEach(product => {
          console.log(`     - ${product.title} (Qty: ${product.quantity})`);
        });
      });
      
      console.log(`\n💡 NOTE: These existing pending orders can be safely ignored or cleaned up.`);
      console.log(`The new system prevents creation of pending orders on payment failure.`);
    } else {
      console.log('✅ No pending orders found - system is clean!');
    }
    
    // Check recent successful orders
    const recentOrders = await prisma.order.findMany({
      where: { 
        paidAt: { not: null }
      },
      include: {
        user: { select: { email: true } }
      },
      orderBy: { paidAt: 'desc' },
      take: 5
    });
    
    console.log(`\n✅ Recent successful orders: ${recentOrders.length}`);
    recentOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order #${order.id} - ${order.user.email} - ₹${order.total / 100} (${order.paidAt})`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingPendingOrders();
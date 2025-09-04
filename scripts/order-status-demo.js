const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demonstrateOrderStatusFlow() {
  try {
    console.log('🔄 Order Status Flow Demonstration');
    console.log('=====================================\n');
    
    // Get all orders and show their statuses
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        paidAt: true,
        paymentId: true,
        gatewayOrderId: true,
        createdAt: true,
        user: {
          select: { fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📋 Current Order Status Summary:');
    console.log('--------------------------------\n');
    
    const statusMap = {
      'pending': '🟡 Order Pending (awaiting payment or admin confirmation)',
      'inProcess': '🔵 Processing (payment confirmed, preparing for shipment)',
      'delivered': '🟢 Delivered (order completed)'
    };
    
    const statusCounts = { pending: 0, inProcess: 0, delivered: 0 };
    
    orders.forEach(order => {
      const statusInfo = statusMap[order.status] || `❓ ${order.status}`;
      const paymentInfo = order.paymentId ? 'Paid Online' : 'COD/Pending';
      
      console.log(`Order #${order.id} - ${order.user?.fullName || 'Unknown'}`);
      console.log(`   ${statusInfo}`);
      console.log(`   Payment: ${paymentInfo}`);
      console.log(`   Created: ${order.createdAt.toLocaleDateString()}`);
      console.log('');
      
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log('📊 Status Distribution:');
    console.log('-----------------------');
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        const icon = statusMap[status] ? statusMap[status].split(' ')[0] : '❓';
        console.log(`${icon} ${status}: ${count} orders`);
      }
    });
    
    console.log('\n✅ Order Lifecycle:');
    console.log('-------------------');
    console.log('1. 🟡 pending     - Order created (all orders start here)');
    console.log('2. 🔵 inProcess   - Payment confirmed (online) OR admin approved (COD)');
    console.log('3. 🟢 delivered   - Admin marks as delivered when shipped');
    
    console.log('\n💡 Expected User Experience:');
    console.log('----------------------------');
    console.log('• After placing order: "Order Pending" (yellow)');
    console.log('• After payment/approval: "Processing" (blue)');
    console.log('• After shipment: "Delivered" (green)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  demonstrateOrderStatusFlow();
}

module.exports = { demonstrateOrderStatusFlow };

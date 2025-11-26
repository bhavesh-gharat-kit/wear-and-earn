// COMPANY EARNINGS VERIFICATION SCRIPT
// Run this to check if company earnings calculations are correct

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCompanyEarnings() {
  try {
    console.log('🔍 VERIFYING COMPANY EARNINGS CALCULATION...\n');

    // Get all delivered orders
    const deliveredOrders = await prisma.order.findMany({
      where: { status: 'delivered' },
      include: {
        orderProducts: {
          include: {
            product: {
              select: { mlmPrice: true, title: true }
            }
          }
        }
      }
    });

    console.log(`📦 Found ${deliveredOrders.length} delivered orders\n`);

    let totalIssues = 0;
    let totalCorrectCommission = 0;
    let totalStoredCommission = 0;

    for (const order of deliveredOrders) {
      console.log(`🔍 Checking Order #${order.id}:`);
      
      // Calculate what commission SHOULD be
      let correctCommissionAmount = 0;
      for (const orderProduct of order.orderProducts) {
        const product = await prisma.product.findUnique({
          where: { id: orderProduct.productId },
          select: { mlmPrice: true, title: true }
        });
        
        if (product && product.mlmPrice) {
          const itemCommission = product.mlmPrice * orderProduct.quantity;
          correctCommissionAmount += itemCommission;
          console.log(`  - ${product.title}: ₹${product.mlmPrice} × ${orderProduct.quantity} = ₹${itemCommission}`);
        }
      }
      
      const correctCommissionPaisa = Math.round(correctCommissionAmount * 100);
      const storedCommissionPaisa = order.commissionAmount;
      
      console.log(`  📊 Correct Commission: ₹${correctCommissionAmount} (${correctCommissionPaisa} paisa)`);
      console.log(`  💾 Stored Commission: ₹${storedCommissionPaisa / 100} (${storedCommissionPaisa} paisa)`);
      
      if (correctCommissionPaisa !== storedCommissionPaisa) {
        console.log(`  ❌ MISMATCH! Difference: ${Math.abs(correctCommissionPaisa - storedCommissionPaisa)} paisa`);
        totalIssues++;
      } else {
        console.log(`  ✅ Correct`);
      }
      
      totalCorrectCommission += correctCommissionPaisa;
      totalStoredCommission += storedCommissionPaisa;
      console.log('');
    }

    // Calculate company earnings
    const correctCompanyEarnings = Math.floor(totalCorrectCommission * 0.30);
    const currentCompanyEarnings = Math.floor(totalStoredCommission * 0.30);

    console.log('📊 SUMMARY:');
    console.log(`Total Orders Checked: ${deliveredOrders.length}`);
    console.log(`Orders with Issues: ${totalIssues}`);
    console.log(`\n💰 COMMISSION TOTALS:`);
    console.log(`Correct Total Commission: ₹${(totalCorrectCommission / 100).toFixed(2)} (${totalCorrectCommission} paisa)`);
    console.log(`Stored Total Commission: ₹${(totalStoredCommission / 100).toFixed(2)} (${totalStoredCommission} paisa)`);
    console.log(`\n🏢 COMPANY EARNINGS (30%):`);
    console.log(`Correct Company Earnings: ₹${(correctCompanyEarnings / 100).toFixed(2)} (${correctCompanyEarnings} paisa)`);
    console.log(`Current Company Earnings: ₹${(currentCompanyEarnings / 100).toFixed(2)} (${currentCompanyEarnings} paisa)`);
    
    if (totalIssues > 0) {
      console.log(`\n❌ ISSUES FOUND: ${totalIssues} orders have incorrect commission amounts`);
      console.log(`📝 RECOMMENDATION: Fix the order creation logic and recalculate stored commission amounts`);
    } else {
      console.log(`\n✅ ALL COMMISSION CALCULATIONS ARE CORRECT!`);
    }

  } catch (error) {
    console.error('❌ Error verifying company earnings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCompanyEarnings();
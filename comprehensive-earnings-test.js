// COMPREHENSIVE COMPANY EARNINGS TEST
// This script tests various scenarios to ensure accuracy

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveTest() {
  try {
    console.log('🧪 COMPREHENSIVE COMPANY EARNINGS TEST\n');

    // Test 1: Check current data accuracy
    console.log('📊 TEST 1: Current Data Verification');
    const deliveredOrders = await prisma.order.findMany({
      where: { status: 'delivered' },
      include: {
        orderProducts: {
          include: {
            product: { select: { mlmPrice: true, title: true, sellingPrice: true } }
          }
        }
      }
    });

    console.log(`Found ${deliveredOrders.length} delivered orders\n`);

    let totalActualMLM = 0;
    let totalStoredCommission = 0;

    for (const order of deliveredOrders) {
      console.log(`Order #${order.id}:`);
      let orderMLMTotal = 0;
      
      for (const item of order.orderProducts) {
        const product = item.product;
        let itemMLM = 0;
        
        if (product.mlmPrice) {
          itemMLM = product.mlmPrice * item.quantity;
        } else {
          // Fallback: 10% of selling price
          itemMLM = (product.sellingPrice * 0.1) * item.quantity;
        }
        
        orderMLMTotal += itemMLM;
        console.log(`  - ${product.title}: MLM ₹${product.mlmPrice || (product.sellingPrice * 0.1)} × ${item.quantity} = ₹${itemMLM}`);
      }
      
      const orderCommissionPaisa = Math.round(orderMLMTotal * 100);
      console.log(`  📊 Calculated MLM Total: ₹${orderMLMTotal} (${orderCommissionPaisa} paisa)`);
      console.log(`  💾 Stored Commission: ₹${order.commissionAmount / 100} (${order.commissionAmount} paisa)`);
      
      if (orderCommissionPaisa === order.commissionAmount) {
        console.log(`  ✅ Match!\n`);
      } else {
        console.log(`  ❌ Mismatch! Difference: ${Math.abs(orderCommissionPaisa - order.commissionAmount)} paisa\n`);
      }
      
      totalActualMLM += orderCommissionPaisa;
      totalStoredCommission += order.commissionAmount;
    }

    // Test 2: Company earnings calculation
    console.log('🏢 TEST 2: Company Earnings Calculation');
    const companyShare = 0.30; // 30%
    const calculatedCompanyEarnings = Math.floor(totalStoredCommission * companyShare);
    
    console.log(`Total MLM Sales: ₹${(totalStoredCommission / 100).toFixed(2)}`);
    console.log(`Company Share (${companyShare * 100}%): ₹${(calculatedCompanyEarnings / 100).toFixed(2)}`);
    console.log(`Remaining for MLM (${(1 - companyShare) * 100}%): ₹${((totalStoredCommission - calculatedCompanyEarnings) / 100).toFixed(2)}\n`);

    // Test 3: Monthly breakdown
    console.log('📅 TEST 3: Monthly Breakdown');
    const now = new Date();
    const monthlyBreakdown = {};
    
    for (const order of deliveredOrders) {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          orders: 0,
          mlmSales: 0,
          companyEarnings: 0
        };
      }
      
      monthlyBreakdown[monthKey].orders++;
      monthlyBreakdown[monthKey].mlmSales += order.commissionAmount;
      monthlyBreakdown[monthKey].companyEarnings += Math.floor(order.commissionAmount * companyShare);
    }
    
    Object.entries(monthlyBreakdown).forEach(([month, data]) => {
      console.log(`${month}: ${data.orders} orders, MLM ₹${(data.mlmSales / 100).toFixed(2)}, Company ₹${(data.companyEarnings / 100).toFixed(2)}`);
    });

    // Test 4: Edge cases
    console.log('\n🔍 TEST 4: Edge Case Analysis');
    
    // Check for orders with zero commission
    const zeroCommissionOrders = deliveredOrders.filter(order => !order.commissionAmount || order.commissionAmount === 0);
    console.log(`Orders with zero commission: ${zeroCommissionOrders.length}`);
    
    // Check for orders with products having no mlmPrice
    let ordersWithoutMLMPrice = 0;
    for (const order of deliveredOrders) {
      const hasProductWithoutMLM = order.orderProducts.some(item => !item.product.mlmPrice);
      if (hasProductWithoutMLM) ordersWithoutMLMPrice++;
    }
    console.log(`Orders with products lacking mlmPrice: ${ordersWithoutMLMPrice}`);

    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    if (totalActualMLM === totalStoredCommission) {
      console.log('✅ All commission calculations are ACCURATE!');
      console.log('✅ Company earnings calculation is CORRECT!');
      console.log(`✅ Admin dashboard should show: ₹${(calculatedCompanyEarnings / 100).toFixed(2)} as company earnings`);
    } else {
      console.log('❌ Commission calculations have discrepancies!');
      console.log('❌ Company earnings may be inaccurate!');
      console.log('📝 Recommendation: Review order creation logic');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveTest();
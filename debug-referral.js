const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugReferral() {
  try {
    // Get all users with their referral codes and orders
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        referralCode: true,
        isActive: true,
        orders: {
          where: {
            AND: [
              {
                OR: [
                  { status: 'delivered' },
                  { status: 'inProcess' }
                ]
              },
              {
                NOT: { paymentId: null }
              },
              {
                NOT: { paidAt: null }
              }
            ]
          },
          select: {
            id: true,
            status: true,
            paymentId: true,
            paidAt: true,
            total: true
          }
        }
      },
      take: 5
    });

    console.log('=== REFERRAL DEBUG ===');
    users.forEach(user => {
      console.log(`\nUser: ${user.fullName} (${user.email})`);
      console.log(`ID: ${user.id}`);
      console.log(`Referral Code: ${user.referralCode || 'NOT SET'}`);
      console.log(`Is Active: ${user.isActive}`);
      console.log(`Paid Orders: ${user.orders.length}`);
      
      if (user.orders.length > 0) {
        console.log('Orders:');
        user.orders.forEach(order => {
          console.log(`  - Order ${order.id}: ${order.status}, Payment: ${order.paymentId}, Amount: ₹${order.total/100}`);
        });
      }
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugReferral();

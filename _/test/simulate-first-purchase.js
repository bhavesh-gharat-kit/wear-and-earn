const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateFirstPurchaseFlow() {
  console.log('🧪 SIMULATING FIRST PURCHASE FLOW');
  console.log('==================================');
  
  try {
    // 1. Create a fresh test user for the simulation
    const testUser = await prisma.user.create({
      data: {
        fullName: 'Purchase Test User',
        mobileNo: `test_purchase_${Date.now()}`,
        password: 'hashedpassword',
        isActive: false, // Should become true after first purchase
        kycStatus: 'PENDING',
        walletBalance: 0,
        monthlyPurchase: 0,
        isEligibleRepurchase: false
      }
    });
    
    console.log('✅ Created test user:', {
      id: testUser.id,
      name: testUser.fullName,
      active: testUser.isActive,
      referralCode: testUser.referralCode
    });

    // 2. Get a test product
    const testProduct = await prisma.product.findFirst({
      where: { isActive: true },
      select: { id: true, title: true, mlmPrice: true, productPrice: true }
    });
    
    if (!testProduct) {
      console.log('❌ No test product found');
      return;
    }
    
    console.log('📦 Using test product:', testProduct);

    // 3. Create a test order
    const testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        total: Math.round((testProduct.productPrice + testProduct.mlmPrice) * 100), // in paisa
        deliveryCharges: 5000, // ₹50
        commissionAmount: Math.round(testProduct.mlmPrice * 100), // in paisa
        gstAmount: 0,
        address: 'Test Address',
        orderNotice: null,
        status: 'pending',
        paymentId: `test_payment_${Date.now()}`,
        isJoiningOrder: true, // This should be true for first purchase
        gatewayOrderId: `test_gateway_${Date.now()}`,
        paidAt: null
      }
    });
    
    console.log('📝 Created test order:', { id: testOrder.id, isJoining: testOrder.isJoiningOrder });

    // 4. Create order product
    await prisma.orderProducts.create({
      data: {
        orderId: testOrder.id,
        productId: testProduct.id,
        title: testProduct.title,
        quantity: 1,
        sellingPrice: Math.round((testProduct.productPrice + testProduct.mlmPrice) * 100),
        discount: 0,
        gst: 18,
        homeDelivery: 5000, // ₹50 in paisa
        finalMRP: Math.round((testProduct.productPrice + testProduct.mlmPrice) * 100),
        totalPrice: Math.round((testProduct.productPrice + testProduct.mlmPrice) * 100)
      }
    });

    // 5. Simulate the MLM processing (what happens in payment verification)
    console.log('🏊 Processing with Pool MLM system...');
    
    await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: testOrder.id },
        data: {
          status: 'inProcess',
          paidAt: new Date(),
          paymentId: `verified_${Date.now()}`
        },
        include: {
          orderProducts: true,
          user: true
        }
      });

      // Simulate generateReferralCodeIfNeeded from pool-mlm-system
      console.log('🎟️ Generating referral code...');
      
      const userId = testUser.id;
      let referralCode;
      let attempts = 0;
      
      do {
        referralCode = `WE${userId.toString().padStart(4, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const existing = await tx.user.findUnique({
          where: { referralCode }
        });
        
        if (!existing) break;
        
        attempts++;
      } while (attempts < 10);
      
      if (attempts >= 10) {
        throw new Error('Failed to generate unique referral code');
      }
      
      // Update user with referral code and active status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          referralCode,
          isActive: true
        }
      });
      
      console.log(`✅ Generated referral code ${referralCode} for user ${userId}`);
      
      return { referralCode, updatedUser };
    });

    // 6. Verify the final state
    const finalUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { id: true, fullName: true, referralCode: true, isActive: true }
    });
    
    console.log('🎯 Final user state:', finalUser);
    
    if (finalUser.referralCode && finalUser.isActive) {
      console.log('🎉 SUCCESS! Referral code generated after first purchase');
    } else {
      console.log('❌ FAILED! Referral code not generated or user not activated');
    }

    // 7. Cleanup test data
    await prisma.orderProducts.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    console.log('🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Error in simulation:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    //await prisma.$disconnect();
  }
}

simulateFirstPurchaseFlow();

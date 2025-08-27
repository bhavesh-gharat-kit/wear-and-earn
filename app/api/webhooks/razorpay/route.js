import prisma from "@/lib/prisma";
import crypto from 'crypto';


export async function POST(req) {
  try {
    const body = await req.json();
    
    // Verify Razorpay webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get('x-razorpay-signature');
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.log('Invalid webhook signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const { event, payload } = body;
    
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const gatewayOrderId = payment.order_id;
      
      console.log('Payment captured for order:', gatewayOrderId);
      
      // Find the order using gateway order ID
      const order = await prisma.order.findFirst({
        where: { gatewayOrderId },
        include: { user: true }
      });
      
      if (!order) {
        console.log('Order not found for gateway order ID:', gatewayOrderId);
        return Response.json({ error: 'Order not found' }, { status: 404 });
      }
      
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Mark order as paid
        await tx.order.update({
          where: { id: order.id },
          data: { 
            status: 'pending', // Set to pending when order is paid as requested
            paidAt: new Date()
          }
        });
        
        // Check if this is user's first paid order (joining order)
        const paidOrdersCount = await tx.order.count({
          where: { 
            userId: order.userId,
            paidAt: { not: null }
          }
        });
        
        const isJoiningOrder = paidOrdersCount === 1; // This is the first paid order
        
        if (isJoiningOrder) {
          console.log('Processing joining order - first paid order for user:', order.userId);
          
          // Import MLM functions
          const { placeUserInMatrix, getGlobalRootId, bfsFindOpenSlot } = await import('@/lib/matrix');
          const { handlePaidJoining, generateReferralCode } = await import('@/lib/commission');
          
          // Generate referral code and activate user
          const referralCode = await generateReferralCode();
          
          await tx.user.update({
            where: { id: order.userId },
            data: { 
              isActive: true,
              referralCode: referralCode
            }
          });
          
          // Get user to check for sponsor
          const user = await tx.user.findUnique({
            where: { id: order.userId },
            select: { sponsorId: true }
          });
          
          // Place user in MLM matrix
          let parentUserId;
          if (user.sponsorId) {
            // Place under sponsor
            parentUserId = user.sponsorId;
          } else {
            // Use auto-filler from global root
            const globalRootId = await getGlobalRootId(tx);
            const slot = await bfsFindOpenSlot(tx, globalRootId);
            parentUserId = slot.parentId;
          }
          
          await placeUserInMatrix(tx, order.userId, parentUserId);
          
          // Mark this order as joining order
          await tx.order.update({
            where: { id: order.id },
            data: { isJoiningOrder: true }
          });
          
          // Get order products for commission calculation
          const orderProducts = await tx.orderProducts.findMany({
            where: { orderId: order.id }
          });
          
          // Process commission
          const orderWithProducts = { 
            ...order, 
            isJoiningOrder: true,
            orderProducts: orderProducts,
            userId: order.userId
          };
          await handlePaidJoining(tx, orderWithProducts);
          
          console.log('User activated with referral code:', referralCode);
        } else {
          console.log('Processing repurchase order for user:', order.userId);
          const { handlePaidRepurchase } = await import('@/lib/commission');
          
          // Get order products for commission calculation
          const orderProducts = await tx.orderProducts.findMany({
            where: { orderId: order.id }
          });
          
          const orderWithProducts = { 
            ...order, 
            isJoiningOrder: false,
            orderProducts: orderProducts,
            userId: order.userId
          };
          await handlePaidRepurchase(tx, orderWithProducts);
        }
        
        // Update monthly purchase amount for eligibility tracking
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        await tx.user.update({
          where: { id: order.userId },
          data: {
            monthlyPurchase: { increment: order.total }
          }
        });
      });
      
      console.log('Commission processing completed for order:', order.id);
    }
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

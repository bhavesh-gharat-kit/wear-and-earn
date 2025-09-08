import prisma from "@/lib/prisma";
import crypto from 'crypto';

/*
 * DEPRECATED WEBHOOK - USING OLD MLM SYSTEM
 * 
 * This webhook still uses the old matrix-based MLM system.
 * The new pool-based MLM system is implemented in:
 * - /api/orders/verify-payment (for order verification and MLM processing)
 * 
 * This webhook can be disabled in Razorpay dashboard if no longer needed,
 * or updated to use the new pool system from lib/pool-mlm-system.js
 */


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
    
    // Handle idempotency - prevent duplicate processing
    const webhookId = payload?.payment?.entity?.id || payload?.order?.entity?.id;
    if (webhookId) {
      const existingWebhook = await prisma.webhookLog.findUnique({
        where: { webhookId }
      });
      
      if (existingWebhook) {
        console.log('Webhook already processed:', webhookId);
        return Response.json({ success: true, message: 'Already processed' });
      }
      
      // Create webhook log for idempotency
      await prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          processedAt: new Date(),
          payload: JSON.stringify(payload)
        }
      });
    }
    
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const gatewayOrderId = payment.order_id;
      
      console.log('Payment captured for order:', gatewayOrderId);
      
      // Find the order using gateway order ID
      const order = await prisma.order.findFirst({
        where: { gatewayOrderId },
        include: { 
          user: true,
          orderProducts: {
            include: { product: true }
          }
        }
      });
      
      if (!order) {
        console.log('Order not found for gateway order ID:', gatewayOrderId);
        return Response.json({ error: 'Order not found' }, { status: 404 });
      }
      
      // Check if order is already marked as paid to prevent double processing
      if (order.paidAt) {
        console.log('Order already processed:', order.id);
        return Response.json({ success: true, message: 'Order already processed' });
      }
      
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Mark order as paid first
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { 
            status: 'paid', // Set status to 'paid' when payment is captured
            paidAt: new Date()
          }
        });

        // Reduce stock for purchased items
        console.log('📦 Reducing stock for purchased items in webhook...');
        for (const orderProduct of order.orderProducts) {
          const product = await tx.product.findUnique({
            where: { id: orderProduct.productId },
            select: { inStock: true, title: true }
          });

          if (product) {
            const newStock = Math.max(0, product.inStock - orderProduct.quantity);
            await tx.product.update({
              where: { id: orderProduct.productId },
              data: { inStock: newStock }
            });
            console.log(`📦 Webhook: Stock reduced for ${product.title}: ${product.inStock} → ${newStock} (sold: ${orderProduct.quantity})`);
          }
        }
        console.log('✅ Webhook: Stock reduction completed');
        
        // Check if this is user's first paid order (joining order)
        const paidOrdersCount = await tx.order.count({
          where: { 
            userId: order.userId,
            paidAt: { not: null }
          }
        });
        
        const isJoiningOrder = paidOrdersCount === 1; // This is the first paid order
        
        console.log(`Processing ${isJoiningOrder ? 'JOINING' : 'REPURCHASE'} order for user:`, order.userId);
        
        if (isJoiningOrder) {
          // FIRST ORDER - JOINING LOGIC
          console.log('Processing joining order - first paid order for user:', order.userId);
          
          // Import MLM functions with correct paths
          const { placeUserInMatrix, getGlobalRootId, bfsFindOpenSlot } = await import('@/lib/mlm-matrix');
          const { handlePaidJoining } = await import('@/lib/mlm-commission');
          const { generateAndAssignReferralCode } = await import('@/lib/referral');
          
          // Generate referral code and activate user
          const referralCode = await generateAndAssignReferralCode(tx, order.userId);
          
          await tx.user.update({
            where: { id: order.userId },
            data: { 
              isActive: true
              // referralCode is already set by generateAndAssignReferralCode
            }
          });
          
          // Get user to check for sponsor
          const user = await tx.user.findUnique({
            where: { id: order.userId },
            select: { sponsorId: true }
          });
          
          // Place user in MLM matrix
          let parentUserId, position;
          if (user.sponsorId) {
            // Try to place under sponsor first
            const slot = await bfsFindOpenSlot(tx, user.sponsorId);
            parentUserId = slot.parentId;
            position = slot.position;
          } else {
            // Use auto-filler from global root
            const globalRootId = await getGlobalRootId(tx);
            const slot = await bfsFindOpenSlot(tx, globalRootId);
            parentUserId = slot.parentId;
            position = slot.position;
          }
          
          await placeUserInMatrix(tx, order.userId, parentUserId, position);
          
          // Mark this order as joining order
          await tx.order.update({
            where: { id: order.id },
            data: { isJoiningOrder: true }
          });
          
          // Process joining commission with order products
          const orderWithProducts = { 
            ...updatedOrder, 
            isJoiningOrder: true,
            orderProducts: order.orderProducts,
            userId: order.userId
          };
          await handlePaidJoining(tx, orderWithProducts);
          
          console.log('User activated with referral code:', referralCode);
          
        } else {
          // REPEAT ORDER - REPURCHASE LOGIC
          console.log('Processing repurchase order for user:', order.userId);
          const { handleRepurchaseCommission } = await import('@/lib/mlm-commission');
          const { isRepurchaseEligible } = await import('@/lib/mlm-matrix');
          
          // Check repurchase eligibility (3-3 rule)
          const isEligible = await isRepurchaseEligible(tx, order.userId);
          console.log('User repurchase eligibility:', isEligible);
          
          // Process repurchase commission with order products
          const orderWithProducts = { 
            ...updatedOrder, 
            isJoiningOrder: false,
            orderProducts: order.orderProducts,
            userId: order.userId
          };
          await handleRepurchaseCommission(tx, orderWithProducts);
        }
        
        // Update monthly purchase amount for eligibility tracking
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        await tx.user.update({
          where: { id: order.userId },
          data: {
            monthlyPurchase: { increment: order.total }
          }
        });
        
        // Create audit ledger entry for order processing
        await tx.ledger.create({
          data: {
            userId: order.userId,
            type: 'order_processed',
            amount: order.total,
            ref: `order:${order.id}:${isJoiningOrder ? 'joining' : 'repurchase'}`,
            description: `Order ${order.id} processed - ${isJoiningOrder ? 'Joining' : 'Repurchase'} order`
          }
        });
      });
      
      console.log('MLM commission processing completed for order:', order.id);
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

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import Razorpay from 'razorpay'
import crypto from 'crypto'

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
} catch (error) {
  console.error('Failed to initialize Razorpay:', error)
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      items,
      address,
      deliveryCharges,
      gstAmount,
      total,
      paymentMethod,
      orderNotice
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!address || !total) {
      return NextResponse.json(
        { success: false, message: 'Address and total are required' },
        { status: 400 }
      )
    }

    const sessionUserId = session.user.id;
    const userRole = session.user.role;

    // Admin users cannot place orders - they manage the system
    if (sessionUserId === "admin" || userRole === "admin") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Admin accounts cannot place orders. Please login with a customer account to purchase items." 
        },
        { status: 403 }
      );
    }

    const userId = parseInt(sessionUserId);
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user session' },
        { status: 400 }
      );
    }

    // Check if this is user's first order (joining order)
    const existingOrders = await prisma.order.count({
      where: { 
        userId, 
        paidAt: { not: null } // Check for paid orders using paidAt field
      }
    });
    const isJoiningOrder = existingOrders === 0;

    // Calculate commission amount from individual product commission amounts
    let totalCommissionAmount = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { commissionAmount: true }
      });
      if (product) {
        totalCommissionAmount += (product.commissionAmount || 0) * item.quantity;
      }
    }

    // Create Razorpay order
    let razorpayOrder = null;
    if (paymentMethod === 'online') {
      if (!razorpay) {
        return NextResponse.json(
          { success: false, message: 'Payment gateway not configured' },
          { status: 500 }
        );
      }
      
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(total * 100), // Amount in paisa
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            userId: userId.toString(),
            isJoiningOrder: isJoiningOrder.toString()
          }
        });
      } catch (error) {
        console.error('Razorpay order creation failed:', error);
        return NextResponse.json(
          { success: false, message: 'Payment gateway error' },
          { status: 500 }
        );
      }
    }

    // Create order in database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          total: Math.round(total * 100), // Store in paisa
          deliveryCharges: Math.round((deliveryCharges || 0) * 100), // Store in paisa
          commissionAmount: Math.round(totalCommissionAmount * 100), // Store in paisa
          gstAmount: Math.round((gstAmount || 0) * 100), // Store in paisa
          address,
          orderNotice: orderNotice || null,
          status: paymentMethod === 'cod' ? 'inProcess' : 'pending',
          paymentId: null,
          isJoiningOrder,
          gatewayOrderId: razorpayOrder?.id || null,
          // For COD orders, set paidAt immediately since they're considered paid for MLM purposes
          paidAt: paymentMethod === 'cod' ? new Date() : null
        }
      })

      // Create order products
      const orderProducts = await Promise.all(
        items.map(item => {
          const finalMRP = Math.round(item.sellingPrice * 100) // Store in paisa
          const totalPrice = finalMRP * item.quantity
          
          return tx.orderProducts.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              title: item.title,
              quantity: item.quantity,
              sellingPrice: Math.round(item.sellingPrice * 100), // Store in paisa
              discount: Math.round((item.discount || 0) * 100), // Store in paisa
              gst: item.gst || 18,
              finalMRP,
              homeDelivery: Math.round((item.homeDelivery || 0) * 100), // Store in paisa
              totalPrice
            }
          })
        })
      )

      // Handle MLM activation for COD orders (they're considered paid immediately)
      if (paymentMethod === 'cod' && isJoiningOrder) {
        console.log('Processing COD joining order - activating MLM for user:', userId);
        
        // Import MLM functions
        const { placeUserInMatrix, getGlobalRootId } = await import('@/lib/mlm-matrix');
        const { handlePaidJoining, generateReferralCode } = await import('@/lib/commission');
        
        // Generate referral code and activate user
        const referralCode = await generateReferralCode();
        
        await tx.user.update({
          where: { id: userId },
          data: { 
            isActive: true,
            referralCode: referralCode
          }
        });
        
        // Get user to check for sponsor
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { sponsorId: true }
        });
        
        // Place user in MLM matrix
        let parentUserId;
        if (user.sponsorId) {
          // Place under sponsor
          parentUserId = user.sponsorId;
        } else {
          // Use auto-filler from global root
          const { bfsFindOpenSlot } = await import('@/lib/mlm-matrix');
          const globalRootId = await getGlobalRootId(tx);
          const slot = await bfsFindOpenSlot(tx, globalRootId);
          parentUserId = slot.parentId;
        }
        
        await placeUserInMatrix(tx, userId, parentUserId);
        
        // Process commission with order products
        const orderWithProducts = { 
          ...order, 
          isJoiningOrder: true,
          orderProducts: orderProducts,
          userId: userId
        };
        await handlePaidJoining(tx, orderWithProducts);
        
        console.log('COD user activated with referral code:', referralCode);
      } else if (paymentMethod === 'cod' && !isJoiningOrder) {
        // Handle repurchase commission for COD orders
        const { handlePaidRepurchase } = await import('@/lib/commission');
        const orderWithProducts = { 
          ...order, 
          isJoiningOrder: false,
          orderProducts: orderProducts,
          userId: userId
        };
        await handlePaidRepurchase(tx, orderWithProducts);
      }
      
      // Update monthly purchase for COD orders
      if (paymentMethod === 'cod') {
        await tx.user.update({
          where: { id: userId },
          data: {
            monthlyPurchase: { increment: Math.round(total * 100) }
          }
        });
      }

      return { order, orderProducts }
    })

    // Clear user's cart after successful order creation
    await prisma.cart.deleteMany({
      where: {
        userId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      orderId: result.order.id,
      order: {
        ...result.order,
        total: result.order.total / 100, // Convert back to rupees for display
        deliveryCharges: result.order.deliveryCharges / 100,
        gstAmount: result.order.gstAmount / 100,
        commissionAmount: result.order.commissionAmount / 100
      },
      razorpayOrder: razorpayOrder // Include for frontend payment processing
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to place order' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionUserId = session.user.id;
    const userRole = session.user.role;

    // Admin users don't have personal orders
    if (sessionUserId === "admin" || userRole === "admin") {
      return NextResponse.json({
        success: true,
        orders: [],
        message: "Admin accounts don't have personal orders"
      })
    }

    const userId = parseInt(sessionUserId);
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user session' },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId
      },
      include: {
        orderProducts: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert paisa to rupees for display
    const ordersWithRupees = orders.map(order => ({
      ...order,
      total: order.total / 100,
      deliveryCharges: order.deliveryCharges / 100,
      gstAmount: order.gstAmount / 100,
      commissionAmount: order.commissionAmount / 100,
      orderProducts: order.orderProducts.map(product => ({
        ...product,
        sellingPrice: product.sellingPrice / 100,
        discount: product.discount / 100,
        finalMRP: product.finalMRP / 100,
        homeDelivery: product.homeDelivery / 100,
        totalPrice: product.totalPrice / 100
      }))
    }))

    return NextResponse.json({
      success: true,
      orders: ordersWithRupees
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

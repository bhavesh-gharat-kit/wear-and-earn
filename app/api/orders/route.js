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

    // Validate stock availability for all items before creating order
    console.log('📦 Validating stock availability...');
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { inStock: true, title: true }
      });

      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (product.inStock < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Insufficient stock for ${product.title}. Available: ${product.inStock}, Requested: ${item.quantity}` 
          },
          { status: 400 }
        );
      }
    }
    console.log('✅ Stock validation passed');

    // Check if this is user's first order (joining order)
    const existingOrders = await prisma.order.count({
      where: { 
        userId, 
        paidAt: { not: null } // Check for paid orders using paidAt field
      }
    });
    const isJoiningOrder = existingOrders === 0;

    // Calculate commission amount from individual product MLM prices
    let totalCommissionAmount = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { mlmPrice: true, sellingPrice: true }
      });
      if (product) {
        // Use mlmPrice if available, otherwise calculate based on percentage of selling price
        const commissionAmount = product.mlmPrice || (product.sellingPrice * 0.1); // Default 10% if no mlmPrice
        totalCommissionAmount += commissionAmount * item.quantity;
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
          status: 'pending', // Always start with pending status
          paymentId: null,
          isJoiningOrder,
          gatewayOrderId: razorpayOrder?.id || null,
                    // For COD orders, we'll update status after admin confirmation
          paidAt: null // Will be set when payment is confirmed
        }
      })

      console.log("creating ordereditems...")
      console.log(items)

      // Create order products
      const orderProducts = await Promise.all(
        items.map(item => {
          const finalMRP = Math.round(item.sellingPrice * 100) // Store in paisa
          const totalPrice = finalMRP * item.quantity
          
          return tx.orderProducts.create({
            data: {
              orderId: order.id,
              size: item.size,
              color: item.color,
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

      // MLM activation and commission processing will be handled when payment is confirmed
      // All orders start as 'pending' regardless of payment method
      
      return { order, orderProducts }
    })

    // Don't clear cart here - it will be cleared after successful payment verification
    // Cart clearing moved to /api/orders/verify-payment to ensure rollback capability
    
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

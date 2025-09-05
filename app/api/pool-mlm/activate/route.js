import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import { processPoolMLMOrder } from '@/lib/pool-mlm-system'

// New order processing with pool-based MLM
export async function POST(request) {
  try {
    const { orderId, userId, amount } = await request.json()
    
    if (!orderId || !userId) {
      return NextResponse.json({ error: 'orderId and userId required' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get order with products
      const order = await tx.order.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          user: true,
          orderProducts: {
            include: { product: true }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Process pool MLM
      const mlmResult = await processPoolMLMOrder(tx, order);
      
      return { order, mlmResult };
    });

    return NextResponse.json({
      success: true,
      message: 'Pool MLM activation completed',
      data: result
    });

  } catch (error) {
    console.error('Pool MLM activation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

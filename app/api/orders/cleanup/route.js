import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

/**
 * API endpoint to cleanup failed/cancelled orders
 * This prevents pending orders from being created when payment fails
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id)

    // Delete the order and its products if payment was never verified
    const deletedOrder = await prisma.$transaction(async (tx) => {
      // First verify the order belongs to the user and is still pending
      const order = await tx.order.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId,
          paidAt: null, // Only delete orders that were never paid
          status: 'pending'
        }
      })

      if (!order) {
        throw new Error('Order not found or already processed')
      }

      // Delete order products first (foreign key constraint)
      await tx.orderProducts.deleteMany({
        where: { orderId: parseInt(orderId) }
      })

      // Delete the order
      const deletedOrder = await tx.order.delete({
        where: { id: parseInt(orderId) }
      })

      console.log(`🗑️ Cleaned up failed order: ${orderId} for user: ${userId}`)
      return deletedOrder
    })

    return NextResponse.json({
      success: true,
      message: 'Failed order cleaned up successfully',
      orderId: deletedOrder.id
    })

  } catch (error) {
    console.error('Error cleaning up failed order:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cleanup order' },
      { status: 500 }
    )
  }
}
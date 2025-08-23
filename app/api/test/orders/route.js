import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { serializeOrderData } from '@/lib/serialization-utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test if we can fetch orders without authentication first
    const orderCount = await prisma.order.count();
    const orders = await prisma.order.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        orderProducts: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Convert BigInt values to numbers for JSON serialization
    const serializedOrders = orders.map(serializeOrderData);

    return NextResponse.json({
      success: true,
      message: `Found ${orderCount} orders in database`,
      data: serializedOrders,
      totalCount: orderCount
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    }, { status: 500 });
  }
}

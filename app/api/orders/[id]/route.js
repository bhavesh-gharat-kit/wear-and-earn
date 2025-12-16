import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from "@/lib/prisma";


export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const param = await params;
    const orderId = parseInt(param.id);
    const sessionUserId = session.user.id;
    const userRole = session.user.role;

    // Admin users don't have personal orders
    if (sessionUserId === "admin" || userRole === "admin") {
      return NextResponse.json(
        { success: false, message: "Admin accounts don't have personal orders" },
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

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId // Ensure user can only access their own orders
      },
      include: {
        orderProducts: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    function convertBigIntToString(obj) {
      if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
      } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [key, typeof value === 'bigint' ? value.toString() : convertBigIntToString(value)])
        );
      }
      return obj;
    }

    // Convert BigInt values in order object
    const safeOrder = convertBigIntToString(order);

    return NextResponse.json({
      success: true,
      order: safeOrder
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

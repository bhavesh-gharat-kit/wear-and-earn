import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { serializeOrderData } from "@/lib/serialization-utils";


export const GET = async (request) => {
    try {
        // Check admin authentication
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return res.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        // Check if user is admin (you can adjust this based on your role field)
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: { role: true }
        });

        if (user?.role !== 'admin') {
            return res.json({
                success: false,
                message: 'Access denied. Admin role required.'
            }, { status: 403 });
        }

        // pagination query
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = parseInt(searchParams.get("skip")) || 0;
        const search = searchParams.get("search") || "";
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");

        // Build where clause for filtering
        let whereClause = {};

        // Add search filter (search by user email or order ID)
        if (search) {
            whereClause.OR = [
                {
                    user: {
                        email: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    id: {
                        equals: isNaN(parseInt(search)) ? undefined : parseInt(search)
                    }
                }
            ].filter(Boolean);
        }

        // Add date range filter
        if (fromDate || toDate) {
            whereClause.createdAt = {};
            if (fromDate) {
                whereClause.createdAt.gte = new Date(fromDate);
            }
            if (toDate) {
                const endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999); // End of day
                whereClause.createdAt.lte = endDate;
            }
        }

        const totalCount = await prisma.order.count({
            where: whereClause
        });

        const orders = await prisma.order.findMany({
            where: whereClause,
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        mobileNo: true
                    }
                },
                orderProducts: {
                    select: {
                        id: true,
                        title: true,
                        quantity: true,
                        size: true,
                        color: true,
                        sellingPrice: true,
                        discount: true,
                        gst: true,
                        finalMRP: true,
                        homeDelivery: true,
                        totalPrice: true,
                        productId: true,

                       product: {
  select: {
    images: {
      select: {
        imageUrl: true,
        color: true
      }
    }
  }
}

                            }
                   }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Convert BigInt values to numbers for JSON serialization
        const serializedOrders = orders.map(serializeOrderData);

        return res.json({
            success: true,
            message: "Orders fetched successfully",
            data: serializedOrders,
            totalCount: totalCount
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        }, { status: 500 });
    }
};

// Update order status
export const PATCH = async (request) => {
    try {
        // Check admin authentication
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return res.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: { role: true }
        });

        if (user?.role !== 'admin') {
            return res.json({
                success: false,
                message: 'Access denied. Admin role required.'
            }, { status: 403 });
        }

        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return res.json({
                success: false,
                message: "Order ID and status are required"
            }, { status: 400 });
        }

        // Validate status values
        const validStatuses = ['pending', 'inProcess', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.json({
                success: false,
                message: "Invalid status value"
            }, { status: 400 });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status },
            include: {
                user: {
                    select: {
                        email: true,
                        fullName: true
                    }
                }
            }
        });

        return res.json({
            success: true,
            message: "Order status updated successfully",
            data: updatedOrder
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating order:', error);
        return res.json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        }, { status: 500 });
    }
};

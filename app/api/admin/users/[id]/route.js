import { NextResponse as res } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Force nodejs runtime to prevent edge runtime issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';



export async function GET(request, { params }) {
    try {
        // TODO: Add authentication check later
        // const session = await getServerSession(authOptions);
        // if (!session || session.user.role !== 'admin') {
        //     return res.json({
        //         success: false,
        //         message: "Unauthorized access"
        //     }, { status: 401 });
        // }

        const { id } = await params;
        console.log('Fetching user with ID:', id);

        if (!id || isNaN(Number(id))) {
            return res.json({
                success: false,
                message: "Invalid user ID"
            }, { status: 400 });
        }

        // Import Prisma dynamically to ensure it's available
        const { default: prisma } = await import("@/lib/prisma");

        // First, try to fetch user with basic info only
        const user = await prisma.user.findUnique({
            where: { id: Number(id) }
        });

        if (!user) {
            console.log('User not found with ID:', id);
            return res.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        console.log('User found, fetching related data...');

        // Try to fetch address separately to handle potential errors
        let address = null;
        try {
            address = await prisma.address.findUnique({
                where: { userId: Number(id) }
            });
        } catch (addressError) {
            console.log('Address fetch error:', addressError.message);
        }

        // Try to fetch KYC data separately
        let kycData = null;
        try {
            kycData = await prisma.kycData.findUnique({
                where: { userId: Number(id) }
            });
        } catch (kycError) {
            console.log('KYC fetch error:', kycError.message);
        }

        // Try to fetch orders separately
        let orders = [];
        try {
            orders = await prisma.order.findMany({
                where: { userId: Number(id) },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    totalAmount: true,
                    status: true,
                    createdAt: true
                }
            });
        } catch (orderError) {
            console.log('Orders fetch error:', orderError.message);
        }

        // Combine all data
        const completeUser = {
            ...user,
            address,
            kycData,
            orders
        };

        console.log('Returning complete user data');
        return res.json({
            success: true,
            message: "User fetched successfully",
            data: completeUser
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user:", error);
        console.error("Error stack:", error.stack);
        return res.json({
            success: false,
            message: "Failed to fetch user",
            error: error.message || "Unknown error"
        }, { status: 500 });
    }
}


export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { fullName, mobileNo, email, gender } = body;
        // Check if user exists
    const existingUser = await prisma.user.findUnique({
            where: { id: Number(id) }
        });

        if (!existingUser) {
            return res.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        // Update user
    const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                fullName: fullName || existingUser.fullName,
                mobileNo: mobileNo || existingUser.mobileNo,
                email: email || existingUser.email,
                gender: gender || existingUser.gender
            }
        });

        return res.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating user:", error);
        return res.json({
            success: false,
            message: "Failed to update user",
            error: error.message || "Unknown error"
        }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const userId = Number(id);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        console.log(`Starting deletion process for user ID: ${userId}`);

        // Delete user and all related data using transaction
        await prisma.$transaction(async (tx) => {
            // Delete in order to avoid foreign key constraints
            
            // 1. Delete KYC data
            await tx.kycData.deleteMany({
                where: { userId: userId }
            });

            // 2. Delete cart items
            await tx.cart.deleteMany({
                where: { userId: userId }
            });

            // 3. Delete addresses
            await tx.address.deleteMany({
                where: { userId: userId }
            });

            // 4. Delete withdrawal requests
            await tx.withdrawalRequest.deleteMany({
                where: { userId: userId }
            });

            // 5. Delete wallet transactions
            await tx.wallet.deleteMany({
                where: { userId: userId }
            });

            // 6. Delete ledger entries
            await tx.ledger.deleteMany({
                where: { userId: userId }
            });

            // 7. Delete payout schedules
            await tx.selfPayoutSchedule.deleteMany({
                where: { userId: userId }
            });

            // 8. Delete purchases
            await tx.purchase.deleteMany({
                where: { userId: userId }
            });

            // 9. Delete self income installments
            await tx.selfIncomeInstallment.deleteMany({
                where: { userId: userId }
            });

            // 10. Update orders to remove user reference but keep order history
            await tx.order.updateMany({
                where: { userId: userId },
                data: { 
                    userId: null // Set to null but keep order history
                }
            });

            // 11. Update referrals to remove sponsor relationship
            await tx.user.updateMany({
                where: { sponsorId: userId },
                data: { sponsorId: null }
            });

            // 12. Finally delete the user
            await tx.user.delete({
                where: { id: userId }
            });

            console.log(`User ${userId} and all related data deleted successfully`);
        });

        return res.json({
            success: true,
            message: "User and all related data deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting user:", error);
        
        // Check if it's a foreign key constraint error
        if (error.code === 'P2003') {
            return res.json({
                success: false,
                message: "Cannot delete user due to existing relationships. Please contact administrator.",
                error: "Foreign key constraint violation"
            }, { status: 400 });
        }

        return res.json({
            success: false,
            message: "Failed to delete user",
            error: error.message || "Unknown error"
        }, { status: 500 });
    }
}
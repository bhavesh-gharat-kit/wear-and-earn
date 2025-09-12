import prisma from "@/lib/prisma";
import { NextResponse as res } from "next/server";



export async function GET(request, { params }) {


    try {
        const { id } = await params;

    const user = await prisma.user.findUnique({
            where: { id: Number(id) }, // ensure it's a number if your ID is int
        });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        return res.json({
            success: true,
            message: "User fetched successfully",
            data: user
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user:", error);
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
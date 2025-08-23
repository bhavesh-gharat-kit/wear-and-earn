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

        // Delete user
    await prisma.user.delete({
            where: { id: Number(id) }
        });

        return res.json({
            success: true,
            message: "User deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting user:", error);
        return res.json({
            success: false,
            message: "Failed to delete user",
            error: error.message || "Unknown error"
        }, { status: 500 });
    }
}
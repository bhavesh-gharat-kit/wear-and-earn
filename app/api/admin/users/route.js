// app/api/users/route.js
import prisma from "@/lib/prisma";
import { NextResponse as res } from "next/server";


export async function GET(request) {
    try {
        // pagination query
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = parseInt(searchParams.get("skip")) || 0;
        const searchTerm = searchParams.get("searchTerm") || "";

        const where = searchTerm
            ? {
                OR: [
                    { fullName: { contains: searchTerm } },
                    { email: { contains: searchTerm } },
                    { mobileNo: { contains: searchTerm } },
                ],
            }
            : {};

        const totalCount = await prisma.user.count({where})

        const users = await prisma.user.findMany({
            skip,
            take: limit,
            where,
            select: {
                id: true,
                fullName: true,
                email: true,
                mobileNo: true,
                createdAt: true
            },
            orderBy: {
                createdAt: "desc" // latest first
            }
        });

        return res.json({
            success: true,
            message: "Users fetched successfully",
            data: users,
            totalCount: totalCount
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching users:", error);
        return res.json({
            success: false,
            message: "Failed to fetch users",
            error: error.message || "Unknown error"
        }, { status: 500 });
    }
}

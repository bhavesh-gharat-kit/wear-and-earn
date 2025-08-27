import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";



export const GET = async (request) => {

    try {

        const { searchParams } = new URL(request.url);

        // for pagination query
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = parseInt(searchParams.get("skip")) || 0;

        const totalCount = await prisma.product.count()

        const products = await prisma.product.findMany({
            take: limit,
            skip,
            include: {
                category: true,       // include category info
                // images: true          
                // cart: true         
            },
            orderBy: {
                createdAt: 'desc'     // newest first (optional)
            }
        });

        return res.json({ success: true, message: "Product fetched successfully", products , totalCount}, { status: 200 });

    } catch (error) {
        console.error('Error fetching products:', error);
        return res.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }

}


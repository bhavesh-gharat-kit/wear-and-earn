import { NextResponse as res } from 'next/server';
import prisma from "@/lib/prisma";


export const GET = async (request, { params }) => {

    const { id } = await params

    const product = await prisma.product.findFirst({
        where: {
            id: Number(id), // Make sure this is a number
            isActive: true,
            category: {
                status: true // Only show products from active categories
            }
        },
        include: {
            category: true,
            images: true,
        },
    });

    if (!product) {
        return res.json({ 
            success: false, 
            message: "Product not found or not available", 
            product: null 
        }, { status: 404 });
    }

    return res.json({ success: true, message: "ok", product: product }, { status: 200 })

}
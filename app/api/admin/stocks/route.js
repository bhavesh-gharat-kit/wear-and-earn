// app/api/admin/products/stock/route.js
import prisma from "@/lib/prisma";
import { NextResponse as res } from "next/server";

export async function GET(request) {
    try {

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = parseInt(searchParams.get("skip")) || 0;

        const totalCount = await prisma.product.count({ where: { isActive: true } })

        const products = await prisma.product.findMany({
            where: { isActive: true },
            skip,
            take: limit,
            select: {
                id: true,
                title: true,
                inStock: true
            }
        });

        return res.json({
            success: true,
            message: "Products stock fetched successfully",
            data: products,
            totalCount: totalCount
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching product stock:", error);
        return res.json(
            {
                success: false,
                message: "Failed to fetch product stock",
                error: error.message || "Unknown error"
            },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const { productTitle, productInStock } = await req.json();

        if (!productTitle || productInStock === undefined) {
            return res.json(
                { success: false, message: "productTitle (ID) and productInStock are required" },
                { status: 400 }
            );
        }

        // 1️⃣ Get previous stock
        const product = await prisma.product.findUnique({
            where: { id: Number(productTitle) },
            select: { inStock: true, title: true }
        });

        if (!product) {
            return res.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        const previousStock = product.inStock;

        // 2️⃣ Update stock
        const updatedProduct = await prisma.product.update({
            where: { id: Number(productTitle) },
            data: { inStock: Number(productInStock) },
            select: { id: true, title: true, inStock: true }
        });

        return res.json({
            success: true,
            message: "Stock updated successfully",
            previousStock,
            currentStock: updatedProduct.inStock,
            product: updatedProduct
        });
    } catch (error) {
        console.error("Error updating stock:", error);
        return res.json(
            { success: false, message: "Failed to update stock", error: error.message },
            { status: 500 }
        );
    }
}

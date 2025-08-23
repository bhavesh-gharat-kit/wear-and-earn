import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Test database connection
        const categoriesCount = await prisma.category.count();
        const productsCount = await prisma.product.count();
        
        return NextResponse.json({
            success: true,
            message: "Database connection successful",
            data: {
                categoriesCount,
                productsCount
            }
        });
    } catch (error) {
        console.error("Database test error:", error);
        return NextResponse.json({
            success: false,
            message: "Database connection failed",
            error: error.message
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        // Test creating a simple product
        const testProduct = await prisma.product.create({
            data: {
                title: "Test Product",
                description: "Test Description",
                longDescription: "Test Long Description",
                inStock: 0,
                categoryId: 1, // Assuming category with ID 1 exists
                isActive: false,
                keyFeature: "Test Feature",
                discount: 0,
                price: 100,
                sellingPrice: 100,
                mainImage: null,
                manufacturer: null,
                type: "REGULAR"
            }
        });

        return NextResponse.json({
            success: true,
            message: "Test product created successfully",
            data: testProduct
        });
    } catch (error) {
        console.error("Test product creation error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to create test product",
            error: error.message
        }, { status: 500 });
    }
}

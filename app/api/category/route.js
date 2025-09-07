import { NextResponse as res } from 'next/server';
import prisma from "@/lib/prisma";


export const GET = async () => {

    try {
        // First get all active categories only
        const categories = await prisma.category.findMany({
            where: {
                status: true // Only fetch active categories
            },
            select: {
                id: true,
                name: true,
                status: true,
                products: {
                    take: 1, // Get only one product for image display
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        images: true,
                    },
                },
            },
        });

        // Then get product count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await prisma.product.count({
                    where: {
                        categoryId: category.id
                    }
                });
                
                return {
                    ...category,
                    productCount: productCount
                };
            })
        );

        return res.json({ 
            success: true, 
            message: "Fetched category data successfully", 
            data: categoriesWithCount 
        }, { status: 200 });
        
    } catch (error) {
        console.error("Category API Error:", error);
        return res.json({ 
            success: false, 
            message: "Internal Server Error While Fetching the Category" 
        }, { status: 500 });
    }

}
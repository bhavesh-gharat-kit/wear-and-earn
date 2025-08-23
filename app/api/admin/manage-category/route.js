import { NextResponse as res } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const GET = async (request) => {

    try {
        // pagination query
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = parseInt(searchParams.get("skip")) || 0;

        const totalCount = await prisma.category.count()

        const categories = await prisma.category.findMany({
            skip,
            take: limit
            // include: {
            //     products: true // 👈 or use `_count` if you only want count
            // }
        });

        return res.json({ success: true, message: "Categories Details Fetched Successfully", response: categories, totalCount: totalCount }, { status: 200 });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.json(
            { error: 'Failed to fetch categories', error: error },
            { status: 500 }
        );
    }

}

export const POST = async (request) => {
    try {
        const { name, description } = await request.json();

        // Basic validation
        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const newCategory = await prisma.category.create({
            data: {
                name,
                description,
                status: true,
            },
        });

        return res.json({ success: true, message: "Category Added", response: newCategory }, { status: 201 })
    } catch (error) {
        console.error("Create category error:", error);
        return res.json({ success: false, message: "Internal Sever Error", error: error }, { status: 500 })
    }
}
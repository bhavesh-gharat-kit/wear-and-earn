import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req) {
    try {
        const formData = await req.formData();

        const title = formData.get("title");
        const file = formData.get("thumbnailImage");

        console.log("Banner creation request:", { title, fileReceived: !!file });

        if (!title || !file) {
            return res.json({
                success: false,
                message: "Title and thumbnailImage are required",
            }, { status: 400 });
        }

        // Validate file object (Node.js compatible)
        if (!file || typeof file !== 'object' || !file.name || file.size === 0) {
            return res.json({
                success: false,
                message: "Invalid file format",
            }, { status: 400 });
        }

        // Create folder if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
        const filePath = path.join(uploadDir, fileName);

        // Save file locally
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        // Store relative path in DB (removed link field)
        const banner = await prisma.banners.create({
            data: {
                title,
                imageUrl: `/uploads/banners/${fileName}`,
            },
        });

        console.log("Banner created successfully:", banner);

        return res.json({
            success: true,
            message: "Banner uploaded successfully",
            data: banner,
        }, { status: 201 });

    } catch (error) {
        console.error("Error uploading banner:", error);
        return res.json({
            success: false,
            message: "Failed to upload banner",
            error: error.message,
        }, { status: 500 });
    }
}



export const GET = async (request) => {
    try {

        // for pagination query
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = parseInt(searchParams.get("skip")) || 0;

        const totalCount = await prisma.Banners.count()

        const response = await prisma.Banners.findMany({
            take: limit,
            skip,
            orderBy: {
                createdAt: "desc"
            }
        })
        return res.json({ sucess: true, message: "Fetched sucessfully", data: response, totalCount: totalCount }, { status: 200 })
    } catch (error) {
        console.log("Internal Server Error While Fetching The Banners Details")
        return res.json({ sucess: false, message: "Internal Server Erorr", error: error }, { status: 500 })
    }
}

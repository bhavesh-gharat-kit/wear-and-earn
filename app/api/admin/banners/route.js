import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary-utils";

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

        // Validate file object
        if (!file || typeof file !== 'object' || !file.name || file.size === 0) {
            return res.json({
                success: false,
                message: "Invalid file format",
            }, { status: 400 });
        }

        // Upload to Cloudinary
        console.log("Uploading banner to Cloudinary...");
        const buffer = Buffer.from(await file.arrayBuffer());
        
        const cloudinaryResult = await uploadImageToCloudinary(buffer, {
            folder: 'banners',
            public_id: `banner-${Date.now()}`
        });

        console.log("Cloudinary upload result:", cloudinaryResult);

        // Store Cloudinary URL in DB
        const banner = await prisma.Banners.create({
            data: {
                title,
                imageUrl: cloudinaryResult.url,
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
        const limit = parseInt(searchParams.get("limit")) || 20;
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

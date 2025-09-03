import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "@/lib/cloudinary-utils";


export async function GET(req, { params }) {
    try {
        const parameter = await params;
        const bannerId = await parameter.id;

        if (isNaN(bannerId)) {
            return res.json(
                { success: false, message: "Invalid banner ID" },
                { status: 400 }
            );
        }

        const banner = await prisma.banners.findUnique({
            where: { id: Number(bannerId) },
        });

        if (!banner) {
            return res.json(
                { success: false, message: "Banner not found" },
                { status: 404 }
            );
        }

        return res.json({ success: true, data: banner }, { status: 200 });
    } catch (error) {
        return res.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}


export async function PUT(req, { params }) {
    try {
        const bannerId = Number(await params.id);
        if (isNaN(bannerId)) {
            return res.json({ success: false, message: "Invalid ID" }, { status: 400 });
        }

        const formData = await req.formData();
        const title = formData.get("title");
        const imageFile = formData.get("thumbnailImage");

        console.log("Banner update request:", { bannerId, title, hasImage: !!imageFile });

        if (!title) {
            return res.json({ success: false, message: "Title is required" }, { status: 400 });
        }

        const existingBanner = await prisma.banners.findUnique({
            where: { id: bannerId },
        });

        if (!existingBanner) {
            return res.json({ success: false, message: "Banner not found" }, { status: 404 });
        }

        let imageUrl = existingBanner.imageUrl;

        if (imageFile && typeof imageFile === "object" && imageFile.name && imageFile.size > 0) {
            console.log("Uploading new banner image to Cloudinary...");
            
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            
            // Upload new image to Cloudinary
            const cloudinaryResult = await uploadImageToCloudinary(buffer, {
                folder: 'banners',
                public_id: `banner-${bannerId}-${Date.now()}`
            });
            
            imageUrl = cloudinaryResult.url;

            // Delete old image from Cloudinary if it exists and is a Cloudinary URL
            if (existingBanner.imageUrl && existingBanner.imageUrl.includes('cloudinary.com')) {
                try {
                    // Extract public_id from Cloudinary URL
                    const urlParts = existingBanner.imageUrl.split('/');
                    const publicIdWithExt = urlParts[urlParts.length - 1];
                    const publicId = `banners/${publicIdWithExt.split('.')[0]}`;
                    
                    await deleteImageFromCloudinary(publicId);
                    console.log("Old banner image deleted from Cloudinary");
                } catch (deleteError) {
                    console.warn("Could not delete old image:", deleteError.message);
                }
            }
        }

        const updatedBanner = await prisma.banners.update({
            where: { id: bannerId },
            data: {
                title,
                imageUrl,
            },
        });

        console.log("Banner updated successfully:", updatedBanner);

        return res.json({ success: true, data: updatedBanner }, { status: 200 });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message }, { status: 500 });
    }
}


export async function DELETE(req, { params }) {
    try {
        const id = parseInt(await params.id);

        // Check if banner exists
        const banner = await prisma.banners.findUnique({
            where: { id },
        });

        if (!banner) {
            return res.json(
                { message: "Banner not found" },
                { status: 404 }
            );
        }

        // Delete local image file if exists
        if (banner.imageUrl) {
            const imagePath = path.join(process.cwd(), "public", banner.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete from DB
        await prisma.banners.delete({
            where: { id },
        });

        return res.json(
            { message: "Banner deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting banner:", error);
        return res.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}


export async function PATCH(req, { params }) {
    try {
        const id = parseInt(await params.id);

        // Find the banner
        const banner = await prisma.banners.findUnique({
            where: { id },
        });

        if (!banner) {
            return res.json(
                { message: "Banner not found" },
                { status: 404 }
            );
        }

        // Toggle isActive value
        const updatedBanner = await prisma.banners.update({
            where: { id },
            data: { isActive: !banner.isActive },
        });

        return res.json(
            { message: "Banner status updated", data: updatedBanner },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error toggling banner status:", error);
        return res.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
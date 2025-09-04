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

        const banner = await prisma.Banners.findUnique({
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

        const existingBanner = await prisma.Banners.findUnique({
            where: { id: bannerId },
        });

        if (!existingBanner) {
            return res.json({ success: false, message: "Banner not found" }, { status: 404 });
        }

        let imageUrl = existingBanner.imageUrl;

        if (imageFile && typeof imageFile === "object" && imageFile.name && imageFile.size > 0) {
            console.log("Uploading new banner image to Cloudinary...");
            
            // Check if Cloudinary is properly configured
            if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
                throw new Error('Cloudinary environment variables not configured');
            }
            
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

        const updatedBanner = await prisma.Banners.update({
            where: { id: bannerId },
            data: {
                title,
                imageUrl,
            },
        });

        console.log("Banner updated successfully:", updatedBanner);

        return res.json({ success: true, data: updatedBanner }, { status: 200 });
    } catch (error) {
        console.error('Banner update error:', error);
        return res.json({ 
            success: false, 
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}


export async function DELETE(req, { params }) {
    try {
        const id = parseInt(await params.id);

        // Check if banner exists
        const banner = await prisma.Banners.findUnique({
            where: { id },
        });

        if (!banner) {
            return res.json(
                { success: false, message: "Banner not found" },
                { status: 404 }
            );
        }

        console.log(`Deleting banner ${id} with image: ${banner.imageUrl}`);

        // Delete image from Cloudinary if it exists
        if (banner.imageUrl && banner.imageUrl.includes('cloudinary.com')) {
            try {
                // Extract public_id from Cloudinary URL
                // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image_name.ext
                const urlParts = banner.imageUrl.split('/');
                const publicIdWithExt = urlParts[urlParts.length - 1];
                const folder = urlParts[urlParts.length - 2];
                const publicId = `${folder}/${publicIdWithExt.split('.')[0]}`;
                
                console.log(`Deleting image from Cloudinary with public_id: ${publicId}`);
                await deleteImageFromCloudinary(publicId);
                console.log("Banner image deleted from Cloudinary successfully");
            } catch (deleteError) {
                console.warn("Could not delete banner image from Cloudinary:", deleteError.message);
                // Continue with banner deletion even if image deletion fails
            }
        }

        // Delete banner from database
        await prisma.Banners.delete({
            where: { id },
        });

        console.log(`Banner ${id} deleted successfully`);

        return res.json(
            { success: true, message: "Banner deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting banner:", error);
        
        if (error.code === 'P2025') {
            return res.json(
                { success: false, message: "Banner not found" },
                { status: 404 }
            );
        }
        
        return res.json(
            { success: false, message: "Failed to delete banner", error: error.message },
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
import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from "path";


export const PATCH = async (request, { params }) => {

    const { id } = await params;

    try {
        const existingProduct = await prisma.product.findUnique({
            where: { id: Number(id) },
            select: { isActive: true }
        });

        if (!existingProduct) {
            return res.json({ error: 'Product not found' }, { status: 404 });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                isActive: !existingProduct.isActive
            }
        });

        return res.json({ sucess: true, message: "Product data fetched", response: updatedProduct }, { status: 200 });
    } catch (error) {
        console.error('Error toggling product status:', error);
        return res.json(
            { error: 'Failed to toggle product status' },
            { status: 500 }
        );
    }
}



export const DELETE = async (request, { params }) => {
    const { id } = await params;

    try {
        const productId = Number(id);

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!existingProduct) {
            return res.json({ error: 'Product not found' }, { status: 404 });
        }

        // Delete related product images first
        await prisma.productImage.deleteMany({
            where: { productId }
        });

        // Now delete the product
        await prisma.product.delete({
            where: { id: productId }
        });

        return res.json({ message: 'Product deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
};


async function saveFileToUploads(file) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'product-images');
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    return `/uploads/product-images/${fileName}`;
}


export async function PUT(request, { params }) {

    console.log("called")

    try {
        const parameter = await params;
        const productId = parseInt(parameter.id);
        if (Number.isNaN(productId)) {
            return Response.json({ success: false, message: "Invalid product id" }, { status: 400 });
        }

        const formData = await request.formData();
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (!(value instanceof File)) data[key] = value;
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id: Number(productId) },
            include: { images: true },
        });
        if (!existingProduct) {
            return Response.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        // Thumbnail logic (unchanged)...

        const hasProductImagesField = formData.has("productImages");
        const rawImages = hasProductImagesField ? formData.getAll("productImages") : null;

        const incomingImageUrls = [];
        if (rawImages) {
            for (const item of rawImages) {
                if (item instanceof File && item.name) {
                    const url = await saveFileToUploads(item);
                    incomingImageUrls.push(url);
                } else if (typeof item === "string") {
                    const trimmed = item.trim();
                    if (trimmed && trimmed !== "[object Object]") {
                        try {
                            const parsed = JSON.parse(trimmed);
                            if (parsed?.imageUrl) incomingImageUrls.push(parsed.imageUrl);
                            else incomingImageUrls.push(trimmed);
                        } catch {
                            incomingImageUrls.push(trimmed);
                        }
                    }
                }
            }
        }

        const finalIncomingUrls = Array.from(new Set(incomingImageUrls.filter(Boolean)));

        const updateData = { /* map fields accordingly */ };

        if (rawImages !== null) {
            const existingUrls = existingProduct.images.map(img => img.imageUrl);
            const toDelete = existingUrls.filter(u => !finalIncomingUrls.includes(u));
            const toCreate = finalIncomingUrls.filter(u => !existingUrls.includes(u));
            const imagesOps = {};

            if (toDelete.length > 0) {
                imagesOps.deleteMany = { imageUrl: { in: toDelete } };
                // Additional unlink logic...
            } else if (finalIncomingUrls.length === 0 && existingUrls.length > 0) {
                imagesOps.deleteMany = {};
            }

            if (toCreate.length > 0) {
                imagesOps.create = toCreate.map(u => ({ imageUrl: u }));
            }

            if (Object.keys(imagesOps).length > 0) {
                updateData.images = imagesOps;
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: updateData,
            include: { images: true, category: true },
        });

        return Response.json({ success: true, product: updatedProduct }, { status: 200 });
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}



import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";


export async function POST(req) {

    try {

        const formData = await req.formData();

        // const { title, description, category, maxPrice, discount, price, overview } = formData

        const data = {};

        // 1. Extract fields
        for (const [key, value] of formData.entries()) {
            // Check if value is a file by checking if it has file-like properties
            if (typeof value === 'object' && value !== null && 'name' in value && 'size' in value && 'type' in value) {
                console.log(`Skipping file field: ${key}, file name: ${value.name}, size: ${value.size}`);
                continue; // skip files here
            }
            data[key] = value;
        }

        // 2. Handle single thumbnail image
        const thumbnail = formData.get('thumbnailImage');
        let thumbnailUrl = null;

        if (thumbnail && typeof thumbnail === 'object' && thumbnail.name && thumbnail.size > 0) {
            try {
                const buffer = Buffer.from(await thumbnail.arrayBuffer());
                const fileName = `${Date.now()}-${thumbnail.name}`;
                const filePath = path.join(process.cwd(), 'public/uploads/product-images', fileName);
                await writeFile(filePath, buffer);
                thumbnailUrl = `/uploads/product-images/${fileName}`;
            } catch (fileError) {
                console.error("Error processing thumbnail:", fileError);
                // Continue without thumbnail if file processing fails
            }
        }

        // 3. Handle multiple product images
        const productImageFiles = formData.getAll('productImages');
        const productImageUrls = [];

        for (const image of productImageFiles) {
            if (!image || typeof image !== 'object' || !image.name || image.size === 0) continue;
            try {
                const buffer = Buffer.from(await image.arrayBuffer());
                const fileName = `${Date.now()}-${image.name}`;
                const filePath = path.join(process.cwd(), 'public/uploads/product-images', fileName);
                await writeFile(filePath, buffer);
                productImageUrls.push(`/uploads/product-images/${fileName}`);
            } catch (fileError) {
                console.error("Error processing product image:", fileError);
                // Continue without this image if file processing fails
            }
        }

        // ✅ You now have:
        // data => all form fields (title, price, etc.)
        // thumbnailUrl => local path to thumbnail
        // productImageUrls => array of image paths

        // Optional: Upload to Cloudinary here, then delete local file
        // await cloudinary.uploader.upload(filePath);
        // await unlink(filePath);


        console.log("Form data received:", data);
        console.log("Thumbnail URL:", thumbnailUrl);
        console.log("Product image URLs:", productImageUrls);

        // Validate required fields
        if (!data.title || !data.description || !data.category) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: title, description, or category'
            }, { status: 400 });
        }

        // Validate category ID exists
        const categoryExists = await prisma.category.findUnique({
            where: { id: Number(data.category) }
        });

        if (!categoryExists) {
            return NextResponse.json({
                success: false,
                message: 'Invalid category ID'
            }, { status: 400 });
        }

        const newProduct = await prisma.product.create({
            data: {
                title: data.title,
                description: data.description,
                longDescription: data.overview || "",
                inStock: 0,
                categoryId: Number(data.category),
                isActive: false,
                keyFeature: data.keyFeatures || "",
                discount: data.discount ? Number(data.discount) : 0,
                price: data.maxPrice ? Number(data.maxPrice) : 0,
                sellingPrice: data.price ? Number(data.price) : 0,
                gst: data.gst ? Number(data.gst) : 0,
                homeDelivery: data.shipping ? Number(data.shipping) : 0,
                mlmPrice: data.mlmPrice ? Number(data.mlmPrice) : 0,
                type: data.productType || "REGULAR", // Set product type
                mainImage: thumbnailUrl,
                manufacturer: data.manufacturer || null,
                images: {
                    create: productImageUrls.map((url) => ({ imageUrl: url }))
                }
            },
            include: {
                images: true
            }
        });


        return NextResponse.json({
            success: true,
            message: 'Product received',
            newProduct,
            data,
            thumbnailUrl,
            productImageUrls,
        }, { status: 200 });

    } catch (error) {
        console.error("Detailed error while adding product:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        return NextResponse.json({ 
            success: false, 
            message: "Internal server error while adding product",
            error: error.message 
        }, { status: 500 });
    }
}

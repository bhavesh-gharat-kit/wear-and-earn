import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary-utils";


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

        // 3. Handle multiple product images + thumbnail
        const productImageFiles = formData.getAll('productImages');
        const productImageUrls = [];

        // Add thumbnail as first image if exists
        const thumbnail = formData.get('thumbnailImage');
        if (thumbnail && typeof thumbnail === 'object' && thumbnail.name && thumbnail.size > 0) {
            try {
                console.log("Processing thumbnail image:", {
                    name: thumbnail.name,
                    size: thumbnail.size,
                    type: thumbnail.type
                });
                
                console.log("Converting thumbnail to buffer...");
                const buffer = Buffer.from(await thumbnail.arrayBuffer());
                console.log("Buffer created, size:", buffer.length, "bytes");
                
                console.log("Uploading thumbnail to Cloudinary...");
                const cloudinaryResult = await uploadImageToCloudinary(buffer, {
                    folder: 'products/thumbnails',
                    public_id: `thumbnail-${Date.now()}-${Math.random().toString(36).substring(2)}`
                });
                
                productImageUrls.push(cloudinaryResult.url); // Add thumbnail as first image
                console.log("✅ Thumbnail uploaded successfully:", cloudinaryResult.url);
            } catch (fileError) {
                console.error("❌ Error processing thumbnail:", fileError);
                console.error("Thumbnail error details:", {
                    message: fileError.message,
                    stack: fileError.stack
                });
                // Return error instead of continuing without thumbnail
                return NextResponse.json({
                    success: false,
                    message: `Failed to upload thumbnail: ${fileError.message}`
                }, { status: 500 });
            }
        }

        console.log(`Processing ${productImageFiles.length} additional product images...`);

        for (const [index, image] of productImageFiles.entries()) {
            if (!image || typeof image !== 'object' || !image.name || image.size === 0) {
                console.log(`Skipping empty image at index ${index}`);
                continue;
            }
            
            try {
                console.log(`Processing product image ${index + 1}:`, {
                    name: image.name,
                    size: image.size,
                    type: image.type
                });
                
                console.log(`Converting image ${index + 1} to buffer...`);
                const buffer = Buffer.from(await image.arrayBuffer());
                console.log(`Buffer created for image ${index + 1}, size:`, buffer.length, "bytes");
                
                console.log(`Uploading product image ${index + 1} to Cloudinary...`);
                const cloudinaryResult = await uploadImageToCloudinary(buffer, {
                    folder: 'products/images',
                    public_id: `product-${Date.now()}-${index}-${Math.random().toString(36).substring(2)}`
                });
                
                productImageUrls.push(cloudinaryResult.url);
                console.log(`✅ Product image ${index + 1} uploaded successfully:`, cloudinaryResult.url);
            } catch (fileError) {
                console.error(`❌ Error processing product image ${index + 1}:`, fileError);
                console.error(`Image ${index + 1} error details:`, {
                    message: fileError.message,
                    stack: fileError.stack
                });
                // Return error instead of continuing without this image
                return NextResponse.json({
                    success: false,
                    message: `Failed to upload product image ${index + 1}: ${fileError.message}`
                }, { status: 500 });
            }
        }

        // ✅ You now have:
        // data => all form fields (title, price, etc.)
        // productImageUrls => array of image paths (thumbnail + product images)


        console.log("Form data received:", data);
        console.log("All product image URLs:", productImageUrls);

        // Validate required fields for new spec
        if (!data.title || !data.description || !data.category) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: title, description, or category'
            }, { status: 400 });
        }

        // NEW SPEC: Validate pricing structure
        if (!data.productPrice || !data.mlmPrice) {
            return NextResponse.json({
                success: false,
                message: 'Both Product Price (Pr) and MLM Price (Pm) are required as per MLM Pool Plan spec'
            }, { status: 400 });
        }

        const productPrice = Number(data.productPrice); // Pr
        const mlmPrice = Number(data.mlmPrice);         // Pm
        const totalPrice = productPrice + mlmPrice;     // Total = Pr + Pm

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
                inStock: data.inStock ? Number(data.inStock) : 1,
                isActive: true,
                keyFeature: data.keyFeatures || "",
                discount: data.discount ? Number(data.discount) : 0,
                
                // NEW SPEC: Clear pricing structure
                productPrice: productPrice,      // Pr - Product Price (goes to company)
                mlmPrice: mlmPrice,             // Pm - MLM Price (30% company, 70% pool)
                price: totalPrice,              // Total Price = Pr + Pm (for compatibility)
                sellingPrice: totalPrice,       // Same as total price (for compatibility)
                
                gst: data.gst ? Number(data.gst) : 18,
                homeDelivery: data.shipping ? Number(data.shipping) : 50,
                type: data.productType || "REGULAR",
                
                // Use category relation instead of categoryId
                category: {
                    connect: { id: Number(data.category) }
                },
                
                images: {
                    create: productImageUrls.map((url) => ({ imageUrl: url }))
                }
            },
            include: {
                images: true,
                category: true
            }
        });


        return NextResponse.json({
            success: true,
            message: 'Product created successfully',
            newProduct,
            data,
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

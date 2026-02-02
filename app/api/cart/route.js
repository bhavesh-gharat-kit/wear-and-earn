import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const POST = async (request) => {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id;
    const userRole = session?.user?.role;
    
    // Check if user is authenticated
    if (!session || !sessionUserId) {
        return NextResponse.json(
            { success: false, message: "Please login to add items to cart" },
            { status: 401 }
        );
    }
    
    // Admin users cannot have carts - they manage products, not buy them
    if (userRole === "admin") {
        return NextResponse.json(
            { 
                success: false, 
                message: "Admin accounts cannot add items to cart. Please login with a customer account to purchase items." 
            },
            { status: 403 }
        );
    }
    
    // Handle regular users only
    const userId = Number(sessionUserId);
    const productId = Number(body?.productId);
    const quantity = Number(body?.quantity) || 1;
    const size = body?.size || null; // Get size from request body
    const color = body?.color || null; 

    if (!userId || isNaN(userId) || !productId || isNaN(productId)) {
        return NextResponse.json({ error: "Missing fields or invalid user/product ID" }, { status: 400 });
    }

    try {
        // Check if product exists and get its details
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { sizes: true, colors: true }
        });

        if (!product) {
            return NextResponse.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        // Validate size if product has sizes
        const productHasSizes = product.sizes && product.sizes.trim() !== '';
        if (productHasSizes) {
            if (!size) {
                return NextResponse.json(
                    { success: false, message: "Please select a size" },
                    { status: 400 }
                );
            }
            
            // Validate that the selected size is valid for this product
            const availableSizes = product.sizes.split(", ").map(s => s.trim());
            if (!availableSizes.includes(size)) {
                return NextResponse.json(
                    { success: false, message: "Invalid size selected" },
                    { status: 400 }
                );
            }
        }

        // Validate color if product has colors
const productHasColors = product.colors && product.colors.trim() !== '';
if (productHasColors) {
    if (!color) {
        return NextResponse.json(
            { success: false, message: "Please select a color" },
            { status: 400 }
        );
    }

    const availableColors = product.colors.split(",").map(c => c.trim());
    if (!availableColors.includes(color)) {
        return NextResponse.json(
            { success: false, message: "Invalid color selected" },
            { status: 400 }
        );
    }
}

        // Check if product with same size already in cart
        const existingCartItem = await prisma.cart.findFirst({
            where: {
                userId,
                productId,
                size: size, // Include size in the check
                color: color,
            },
        });

        if (existingCartItem) {
            // Optionally update quantity instead of rejecting
            // For now, we'll return that item already exists
            return NextResponse.json(
                { success: true, message: "Item with this size already in Cart" },
                { status: 409 }
            );
        }

        // Create new cart item with size
        const cartResponse = await prisma.cart.create({
            data: {
                userId,
                productId,
                quantity,
                size, // Include size in cart item
                color
            },
        });

        return NextResponse.json(
            { success: true, message: "Item added to Cart", response: cartResponse },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { success: false, message: "Server error", error: String(error) },
            { status: 500 }
        );
    }
};

export const GET = async () => {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id;
    const userRole = session?.user?.role;
    
    // Check if user is authenticated
    if (!session || !sessionUserId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Admin users don't have carts
    if (userRole === "admin") {
        return NextResponse.json({ 
            success: true, 
            data: [], 
            message: "Admin accounts don't have shopping carts" 
        }, { status: 200 });
    }

    const userId = Number(sessionUserId);
    if (!userId || isNaN(userId)) {
        return NextResponse.json({ message: "Invalid user ID" }, { status: 401 });
    }

    try {
        const items = await prisma.cart.findMany({
            where: { userId },
            include: { 
                product: {
                    include: {
                        images: true
                    }
                }
            },
        });
        // Each item now includes 'size' field from the cart table
        return NextResponse.json({ success: true, data: items }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Error fetching cart", error: String(error) },
            { status: 500 }
        );
    }
};
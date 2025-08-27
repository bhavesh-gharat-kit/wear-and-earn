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

    if (!userId || isNaN(userId) || !productId || isNaN(productId)) {
        return NextResponse.json({ error: "Missing fields or invalid user/product ID" }, { status: 400 });
    }

    try {
        // Check if product already in cart
        const existingCartItem = await prisma.cart.findFirst({
            where: {
                userId,
                productId,
            },
        });

        if (existingCartItem) {
            return NextResponse.json(
                { success: true, message: "Item Already in Cart" },
                { status: 409 }
            );
        }

        // Create new cart item
        const cartResponse = await prisma.cart.create({
            data: {
                userId,
                productId,
                quantity: 1,
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
            include: { product: true },
        });
        return NextResponse.json({ success: true, data: items }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Error fetching cart", error: String(error) },
            { status: 500 }
        );
    }
};
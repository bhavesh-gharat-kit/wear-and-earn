import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export const GET = async (request, {params}) => {
    try {
        const parameter = await params; 
        const id = await parameter?.id; 

        if (!id) {
            return res.json({ message: "User ID is required" }, { status: 400 });
        }

    const response = await prisma.cart.findMany({
            where: {
                userId: Number(id),
            },
            include: {    // Include user details
                product: true,    // Include product details
            },
        });

        return res.json({ status: "ok", data: response });
    } catch (error) {
        console.error("Error fetching cart:", error);
        return res.json({ message: "Error fetching cart", error: error.message }, { status: 500 });
    }
};



export const DELETE = async (request, { params }) => {
    try {
        const session = await getServerSession(authOptions)

        // If no session or no userId, return Unauthorized
        if (!session || !session.user?.id) {
            return res.json({ message: "Unauthorized" }, { status: 401 });
        }

        const loggedUserId = session?.user?.id
        const parameter = await params
        const productId = await parameter?.id

        // If userId or productId is invalid, return bad request
        if (!loggedUserId || !productId) {
            return res.json({ message: "Missing or invalid parameters" }, { status: 400 });
        }

        // Delete the cart item for the logged-in user and the given product
    const deletedItem = await prisma.cart.deleteMany({
            where: {
                userId: Number(loggedUserId),           // Ensure the user is the owner of the cart item
                productId: Number(productId),     // The specific product to remove
            },
        });

        // If no rows were deleted, it means the product wasn't found in the user's cart
        if (deletedItem.count === 0) {
            return res.json({ message: "Product not found in cart" }, { status: 404 });
        }

        // Return success response
        return res.json({ success: true, message: "Product removed from cart" }, { status: 200 });

    } catch (error) {
        console.error("Error removing product from cart:", error);
        return res.json({ message: "Error removing product", error: error.message }, { status: 500 });
    }
}


export const PUT = async (request, params) => {
    try {
        // Get the session to get the logged in user's id
        const session = await getServerSession(authOptions);
        const loggedUserId = session?.user?.id;

        if (!loggedUserId) {
            return res.json({ message: "User not authenticated" }, { status: 401 });
        }

        // Parse the request body for the update
    const body = await request.json();
    const productId = Number(params?.params?.id);
    const quantityValue = Number(body?.quantity);
    const increaseQuantity = Number.isFinite(quantityValue) ? quantityValue : 1;

        if (!productId) {
            return res.json({ message: "Product ID is required" }, { status: 400 });
        }
        // Find the cart item for the logged-in user
    const cartItem = await prisma.cart.findFirst({
            where: {
        userId: Number(loggedUserId),
                productId: Number(productId), // Use the productId to identify the specific item
            },
        });

        if (!cartItem) {
            return res.json({ message: "Product not found in cart" }, { status: 404 });
        }

        // Update the quantity of the cart item by increasing it
    const updatedCartItem = await prisma.cart.update({
            where: {
                id: cartItem.id, // Find the specific cart item by its id
            },
            data: {
        quantity: increaseQuantity,
            },
        });


        return res.json({ message: "Cart Quantity Updated", updatedCartItem });
    } catch (error) {
        console.error("Error in PUT request: ", error);
        return res.json({ message: "Error updating cart" }, { status: 500 });
    }
}
import { NextResponse as res } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const GET = async (request, { params }) => {
    try {
        // Get userId from query parameters
        const parameter = await params
        const userId = parameter.id
        if (!userId) {
            return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 });
        }

        // Fetch address details for the given userId
    const address = await prisma.address.findUnique({
            where: {
                userId: parseInt(userId), // Ensure the userId is treated as an integer
            },
        });

        if (!address) {
            return new Response(JSON.stringify({ error: 'Address not found for this user' }), { status: 404 });
        }

        // Return the address details as a successful response
        return new Response(JSON.stringify({ success: true, address }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching address:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
        });
    }
}
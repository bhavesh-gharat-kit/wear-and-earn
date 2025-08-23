import { NextResponse as res } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const POST = async (request) => {
    try {
        const { userId, houseNo, area, landmark, villageCity, taluka, district, pinCode, state } = await request.json();


        // Validation: Check if all required fields are provided
        if (!userId || !houseNo || !area || !villageCity || !taluka || !district || !pinCode || !state) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
        }

        // Insert the new address into the database
        const newAddress = await prisma.address.create({
            data: {
                userId: userId,
                houseNumber: houseNo,
                area: area,
                landmark: landmark,
                villageOrCity: villageCity,
                taluka: taluka,
                district: district,
                pinCode: Number(pinCode),
                state: state,
            },
        });

        // Return a success response
        return res.json({ sucess: true, response: JSON.stringify({ success: true, address: newAddress }) }, {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating address:', error);
        return res.json({ sucess: false, response: error }, {
            status: 500
        });
    }
}


export const PUT = async (request) => {
    try {
        // Parse the request body
        const {
            userId,
            houseNo,
            area,
            landmark,
            villageCity,
            taluka,
            district,
            pinCode,
            state,
        } = await request.json();

        // Log the incoming data for debugging

        // Validation: Ensure all required fields are provided
        if (!userId || !houseNo || !area || !villageCity || !taluka || !district || !pinCode || !state) {
            return new Response(
                JSON.stringify({ error: 'All fields are required' }),
                { status: 400 }
            );
        }

        // Check if the address exists for the given userId
        const existingAddress = await prisma.address.findUnique({
            where: { userId: Number(userId) },
        });

        if (!existingAddress) {
            // If no address exists for the user, return a 404 response
            return new Response(
                JSON.stringify({ error: 'Address not found for the given user' }),
                { status: 404 }
            );
        }

        // If address exists, update the address with the provided data
        const updatedAddress = await prisma.address.update({
            where: { userId: Number(userId) },
            data: {
                houseNumber: houseNo,
                area: area,
                landmark: landmark,
                villageOrCity: villageCity,
                taluka: taluka,
                district: district,
                pinCode: Number(pinCode),
                state: state,
            },
        });

        // Return a success response with the updated address
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Address updated successfully',
                address: updatedAddress,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error updating address:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: 'An error occurred while updating the address',
                error: error.message,
            }),
            { status: 500 }
        );
    }
}
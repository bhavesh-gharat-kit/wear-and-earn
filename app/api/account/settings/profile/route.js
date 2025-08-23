import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";


export const PUT = async (request) => {
    try {
        // Parse the request body
        const { id, fullName, email, contactNumber, gender } = await request.json();

        // Validate required fields
        if (!id || !fullName || !email || !contactNumber || !gender) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
        }

        // Update user using Prisma
        const updatedUser = await prisma.User.update({
            where: {
                id: Number(id), // Find user by ID
            },
            data: {
                fullName: fullName,
                email: email,
                mobileNo: contactNumber,
                gender: gender
            },
        });

        // Return updated user
        return res.json({ sucess: true, message: "Profile Information Updated", response: JSON.stringify(updatedUser) }, { status: 200 });
    } catch (error) {
        console.error(error);
        return res.json({ sucess: false, message: "Internal Error While Upadting", response: error }, { status: 500 })
    }
}
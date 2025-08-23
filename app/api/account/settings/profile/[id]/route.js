import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async (req , {params}) => {

    if (req.method === 'GET') {
        try {

            const parameter = await params;
            const userId = await parameter.id;

            const user = await prisma.user.findUnique({
                where: {
                    id: Number(userId),
                },
            });

            if (!user) {
                return res.json({ message: 'User not found' });
            }

            return res.json(user);

        } catch (error) {
            console.error('Error fetching user:', error);
            return res.json({ message: 'Error fetching user' });
        }
    } else {
        return res.json({ message: 'Method not allowed' });
    }
}


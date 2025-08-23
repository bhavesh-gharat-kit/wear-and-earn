import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        if (!id || isNaN(id)) {
            return res.json(
                { success: false, error: "Valid contact message ID is required." },
                { status: 400 }
            );
        }

        // Check if the message exists
        const existingMessage = await prisma.ContactForm.findUnique({
            where: { id: Number(id) },
        });

        if (!existingMessage) {
            return res.json(
                { success: false, error: "Contact message not found." },
                { status: 404 }
            );
        }

        // Delete the message
        await prisma.ContactForm.delete({
            where: { id: Number(id) },
        });

        return res.json(
            { success: true, message: "Contact message deleted successfully." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting contact message:", error);
        return res.json(
            { success: false, error: "Internal server error." },
            { status: 500 }
        );
    }
}
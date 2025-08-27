import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";


export async function POST(req) {
    try {
        const { name, email, subject, message } = await req.json();

        if (!name || !email) {
            return res.json(
                { success: false, error: "Name and email are required." },
                { status: 400 }
            );
        }

    const newContact = await prisma.contactForm.create({
            data: {
                name,
                email,
                subject: subject || null,
                message: message || null,
            },
        });

        return res.json(
            { success: true, message: "Contact form submitted successfully.", data: newContact },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error saving contact form:", error);
        return res.json(
            { success: false, error: "Internal server error." },
            { status: 500 }
        );
    }
}


export async function GET(req) {

    try {

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = parseInt(searchParams.get("skip")) || 0;


    const totalCount = await prisma.contactForm.count()

    const allContactForm = await prisma.contactForm.findMany({
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc" // latest first
            }
        })

        return res.json(
            { success: true, message: "Contact form fetched successfully.", data: allContactForm, totalCount: totalCount },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error fetched contact form:", error);
        return res.json(
            { success: false, error: "Internal server error." },
            { status: 500 }
        );
    }
}

import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt"

export const PUT = async (request) => {
    try {

        const body = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: body.userId },
        });

        if (!user) {
            throw new Error(encodeURIComponent("No user found with this user id"));
        }

        const isValid = await bcrypt.compare(
            body.currentPassword,
            user.password
        );

        if (!isValid) {
            return res.json({ success: false, message: "Your Current Password not correct" }, { status: 409 })
        }
        else {

            const hasingPassword = await bcrypt.hash(body.confirmPassword, 10)

            const user = await prisma.user.update({
                where: { id: body.userId },
                data: {
                    password: hasingPassword
                },
            });

            return res.json({ success: true, message: "Password Updated Successfully", response: user }, { status: 200 })

        }

    } catch (error) {
        console.log("Internal Server Error While Upadting password", error)
        return res.json({ success: true, message: "Internal Server Error While Upadting password" }, { status: 500 })
    }
}


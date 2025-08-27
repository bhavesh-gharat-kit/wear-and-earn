import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";



export const DELETE = async (_, { params }) => {

    const parameter = await params
    const id = await parameter.id

    try {
        await prisma.category.delete({
            where: { id: Number(id) },
        });

        return res.json({ message: 'Category deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        );
    }
}


export const PUT = async (request, { params }) => {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    try {

        const updatedCategory = await prisma.category.update({
            where: { id: Number(id) },
            data: {
                name,
                description,
                status: true,
            },
        });

        return res.json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        return res.json(
            { error: 'Failed to update category' },
            { status: 500 }
        );
    }
}

export const PATCH = async (request, { params }) => {
    const { id } = await params;
    try {
        // First, get the current status
        const existingCategory = await prisma.category.findUnique({
            where: { id: Number(id) },
            select: { status: true }
        });

        if (!existingCategory) {
            return res.json({ error: 'Category not found' }, { status: 404 });
        }

        // Toggle the status
        const updatedCategory = await prisma.category.update({
            where: { id: Number(id) },
            data: {
                status: !existingCategory.status
            }
        });

        return res.json({ success: true, updatedCategory }, { status: 200 });
    } catch (error) {
        console.error('Error toggling status:', error);
        return res.json(
            { error: 'Failed to toggle category status' },
            { status: 500 }
        );
    }
}
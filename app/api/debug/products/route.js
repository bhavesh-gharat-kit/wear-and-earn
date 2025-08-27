import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";


export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        mainImage: true,
        images: true
      },
      take: 10
    })
    
    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

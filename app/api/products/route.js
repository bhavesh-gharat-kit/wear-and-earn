import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Remove individual PrismaClient instance - use singleton
import { NextResponse as res } from 'next/server';

export const PUT = async () => {
  try {
    // 1. Create a category
  const category = await prisma.category.create({
      data: {
        name: 'Cord Set',
      },
    });

    // 2. Create a product in that category
  const product = await prisma.product.create({
      data: {
        title: 'Teal Blue Lehenga',
        description: 'Lightweight and stylish cotton set',
        longDescription: 'Step into timeless elegance with this exquisite teal blue lehenga choli set, a perfect blend of traditional craftsmanship and contemporary charm. Crafted from premium fabric, the lehenga features intricate golden zari embroidery depicting royal motifs such as peacocks, elephants, and floral trees, adding a touch of regal grandeur. The voluminous skirt offers graceful movement and is complemented by a matching embroidered blouse with a flattering neckline and full sleeves, designed to enhance your silhouette.',
        inStock: 10,
        categoryId: category.id,
        isActive: true,
        discount: 10,
        profit: 200,
        gst: 18,
        gatewayFee: 15,
        homeDelivery: 50,
        price: 1200,
        sellingPrice: 1100,
        mainImage: 'https://wearnearn.com/uploads/products/img_6877527ea674d5.08428911.jpg',
        manufacturer: 'WeAreArn',
      },
    });

    return res.json(
      {
        success: true,
        message: 'Inserted category and product',
        response: product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Prisma insert error:', error);
    return res.json(
      {
        success: false,
        message: 'Internal Server Error while inserting data',
      },
      { status: 500 }
    );
  }
};


export const GET = async (request) => {

  try {
    const { searchParams } = new URL(request.url);

    // for productfilter query
    const category = searchParams.get("category") || "";
    const categoryId = searchParams.get("categoryId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const sortBy = searchParams.get("sortBy");

    const where = {
      isActive: true,
      category: {
        status: true // Only get products from active categories
      }
    };

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (category) {
      where.category = {
        name: {
          contains: category,
          // mode: "insensitive",
        },
      };
    }

    if (search) {
      where.title = {
        contains: search,
        // mode: "insensitive",
      };
    }

    if (minPrice || maxPrice) {
      where.sellingPrice = {};
      if (minPrice) where.sellingPrice.gte = Number(minPrice);
      if (maxPrice) where.sellingPrice.lte = Number(maxPrice);
    }

    if (type) {
      // Only accept known values
      const t = String(type).toUpperCase();
      if (["TRENDING", "MLM", "REGULAR"].includes(t)) {
        where.type = t;
      }
    }

    // Define ordering
    let orderBy = { createdAt: 'desc' }; // default

    if (sortBy) {
      switch (sortBy) {
        case 'price-low':
          orderBy = { sellingPrice: 'asc' };
          break;
        case 'price-high':
          orderBy = { sellingPrice: 'desc' };
          break;
        case 'name':
          orderBy = { title: 'asc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        images: true,
      },
    });

    return res.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.json(
      {
        success: false,
        message: "Failed to fetch products",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
};
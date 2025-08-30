import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";

// Seed demo data using images already in /public/uploads and /public/images
// POST /api/seed -> inserts categories, products (with images), and banners
// GET /api/seed -> returns a preview of what exists (counts)

export async function GET() {
  const [categories, products, banners] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.banners.count(),
  ]);
  return res.json({ success: true, counts: { categories, products, banners } }, { status: 200 });
}

export async function POST() {
  try {
    // 1) Categories
    const categoryNames = ["Lehenga", "Saree", "Kurta Set", "Ethnic Wear"];
    const categoryMap = {};
    for (const name of categoryNames) {
      const existing = await prisma.category.findUnique({ where: { name } });
      const cat = existing || (await prisma.category.create({ data: { name, status: true } }));
      categoryMap[name] = cat.id;
    }

    // 2) Demo products with local images
    // Picked from /public/uploads/product-images and a fallback /public/images/who-we-are-right-img.webp
    const demoProducts = [
      {
        title: "Teal Blue Lehenga",
        category: "Lehenga",
        price: 1200,
        sellingPrice: 1100,
        inStock: 10,
        isActive: true,
        mainImage: "/uploads/product-images/1754996774590-img_68775741612128.57042302.jpg",
        images: [
          "/uploads/product-images/1754996774590-img_68775741612128.57042302.jpg",
          "/uploads/product-images/1754996774582-img_6877527ea674d5.webp",
          "/uploads/product-images/1754992980976-img_687755f3562541.webp",
        ],
      },
      {
        title: "Classic Saree Ensemble",
        category: "Saree",
        price: 2200,
        sellingPrice: 1999,
        inStock: 15,
        isActive: true,
        mainImage: "/uploads/product-images/1755008376465-img_68775741612128.57042302.jpg",
        images: [
          "/uploads/product-images/1755008376466-img_6877527ea674d5.webp",
          "/uploads/product-images/1754992980981-img_687755f3562541.webp",
        ],
      },
      {
        title: "Festive Kurta Set",
        category: "Kurta Set",
        price: 1500,
        sellingPrice: 1399,
        inStock: 25,
        isActive: true,
        mainImage: "/uploads/product-images/1754633982127-img_68775741612128.57042302.jpg",
        images: [
          "/uploads/product-images/1754634091103-img_6877527ea674d5.webp",
          "/uploads/product-images/1754992980978-img_68775741612128.57042302.jpg",
        ],
      },
      {
        title: "Everyday Ethnic Wear",
        category: "Ethnic Wear",
        price: 999,
        sellingPrice: 849,
        inStock: 30,
        isActive: true,
        // fallback local display image
        mainImage: "/images/who-we-are-right-img.webp",
        images: [
          "/uploads/product-images/1754996774594-person-3.webp",
          "/uploads/product-images/1755099467979-1.webp",
        ],
      },
    ];

    const createdProducts = [];
    for (const p of demoProducts) {
      const exists = await prisma.product.findFirst({ where: { title: p.title } });
      if (exists) {
        createdProducts.push({ id: exists.id, title: exists.title, skipped: true });
        continue;
      }
      const product = await prisma.product.create({
        data: {
          title: p.title,
          description: `${p.title} demo description`,
          longDescription:
            `${p.title} — demo long description. Locally-seeded product for UI showcasing and testing.`,
          inStock: p.inStock,
          categoryId: categoryMap[p.category],
          isActive: p.isActive,
          discount: 0,
          profit: 0,
          gst: 0,
          gatewayFee: 0,
          homeDelivery: 0,
          price: p.price,
          sellingPrice: p.sellingPrice,
          keyFeature: "Comfortable, Stylish, Durable",
          mainImage: p.mainImage,
          manufacturer: "WeAreArn",
          images: {
            create: p.images.map((url) => ({ imageUrl: url })),
          },
        },
        include: { images: true },
      });
      createdProducts.push({ id: product.id, title: product.title });
    }

    // 3) Demo banners using local uploads and images
    const demoBanners = [
  { title: "Landing Banner 1", imageUrl: "/images/brand-landing-bg-banner.png", link: "/" },
      { title: "Landing Banner 2", imageUrl: "/images/brand-landing-bg-banner2.png", link: "/products" },
      { title: "Promo Banner A", imageUrl: "/uploads/banners/1754918803276-MERN_Stack.webp", link: "/products" },
      { title: "Promo Banner B", imageUrl: "/uploads/banners/1754906877742-532.png", link: "/about-us" },
    ];

    const createdBanners = [];
    for (const b of demoBanners) {
      const existing = await prisma.banners.findFirst({ where: { title: b.title } });
      if (existing) {
        createdBanners.push({ id: existing.id, title: existing.title, skipped: true });
        continue;
      }
      const banner = await prisma.banners.create({ data: { title: b.title, imageUrl: b.imageUrl, link: b.link, isActive: true } });
      createdBanners.push({ id: banner.id, title: banner.title });
    }

    return res.json(
      { success: true, summary: { products: createdProducts, banners: createdBanners, categories: Object.keys(categoryMap).length } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return res.json({ success: false, message: "Seeding failed", error: String(error) }, { status: 500 });
  }
}

// Seed the database with demo categories, products (with images), and banners
// Uses local images from /public/uploads and /public/images
// Run with: node prisma/seed.mjs (or npm run seed if configured)

import { PrismaClient } from "../app/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // 1) Ensure categories exist
  const categoryNames = ["Lehenga", "Saree", "Kurta Set", "Ethnic Wear"];
  const categoryMap = {};
  for (const name of categoryNames) {
    const existing = await prisma.category.findUnique({ where: { name } });
    const cat = existing || (await prisma.category.create({ data: { name, status: true } }));
    categoryMap[name] = cat.id;
  }

  // 2) Products to create (use local public image paths)
  const demoProducts = [
    {
      title: "Teal Blue Lehenga",
      category: "Lehenga",
      price: 1200,
      sellingPrice: 1100,
      inStock: 10,
      isActive: true,
      type: "TRENDING",
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
  type: "TRENDING",
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
  type: "MLM",
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
  type: "REGULAR",
      mainImage: "/images/who-we-are-right-img.webp",
      images: [
        "/uploads/product-images/1754996774594-person-3.webp",
        "/uploads/product-images/1755099467979-1.webp",
      ],
    },
    {
  title: "Royal Anarkali Gown",
  category: "Lehenga",
  price: 3500,
  sellingPrice: 3299,
  inStock: 12,
  isActive: true,
  type: "TRENDING",
  mainImage: "/uploads/product-images/1755008376000-royal-anarkali.jpg",
  images: [
    "/uploads/product-images/1755008376000-royal-anarkali.jpg",
    "/uploads/product-images/1755008376001-anarkali-side.webp",
  ],
},
{
  title: "Casual Cotton Kurti",
  category: "Kurta Set",
  price: 800,
  sellingPrice: 699,
  inStock: 40,
  isActive: true,
  type: "REGULAR",
  mainImage: "/uploads/product-images/1755008376002-cotton-kurti.jpg",
  images: [
    "/uploads/product-images/1755008376002-cotton-kurti.jpg",
    "/uploads/product-images/1755008376003-kurti-model.webp",
  ],
},
{
  title: "Designer Party Saree",
  category: "Saree",
  price: 2700,
  sellingPrice: 2499,
  inStock: 18,
  isActive: true,
  type: "TRENDING",
  mainImage: "/uploads/product-images/1755008376004-designer-saree.jpg",
  images: [
    "/uploads/product-images/1755008376004-designer-saree.jpg",
    "/uploads/product-images/1755008376005-saree-close.webp",
  ],
},
{
  title: "Wedding Sherwani",
  category: "Ethnic Wear",
  price: 5000,
  sellingPrice: 4799,
  inStock: 8,
  isActive: true,
  type: "MLM",
  mainImage: "/uploads/product-images/1755008376006-wedding-sherwani.jpg",
  images: [
    "/uploads/product-images/1755008376006-wedding-sherwani.jpg",
    "/uploads/product-images/1755008376007-sherwani-model.webp",
  ],
},
{
  title: "Casual Denim Jacket",
  category: "Ethnic Wear",
  price: 1800,
  sellingPrice: 1599,
  inStock: 22,
  isActive: true,
  type: "REGULAR",
  mainImage: "/uploads/product-images/1755008376008-denim-jacket.jpg",
  images: [
    "/uploads/product-images/1755008376008-denim-jacket.jpg",
    "/uploads/product-images/1755008376009-denim-side.webp",
  ],
},
{
  title: "Elegant Bridal Lehenga",
  category: "Lehenga",
  price: 8500,
  sellingPrice: 7999,
  inStock: 6,
  isActive: true,
  type: "TRENDING",
  mainImage: "/uploads/product-images/1755008376010-bridal-lehenga.jpg",
  images: [
    "/uploads/product-images/1755008376010-bridal-lehenga.jpg",
    "/uploads/product-images/1755008376011-bridal-detail.webp",
  ],
},

  ];

  const createdProducts = [];
  for (const p of demoProducts) {
    const exists = await prisma.product.findFirst({ where: { title: p.title } });
    if (exists) {
      // Ensure type is set/updated on existing rows
      if (p.type && exists.type !== p.type) {
        await prisma.product.update({ where: { id: exists.id }, data: { type: p.type } });
        createdProducts.push({ id: exists.id, title: exists.title, updatedType: p.type });
      } else {
        createdProducts.push({ id: exists.id, title: exists.title, skipped: true });
      }
      continue;
    }
    const product = await prisma.product.create({
      data: {
        title: p.title,
        description: `${p.title} demo description`,
        longDescription: `${p.title} — demo long description. Locally-seeded product for UI showcasing and testing.`,
        inStock: p.inStock,
        categoryId: categoryMap[p.category],
        isActive: p.isActive,
          type: p.type,
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

  // 3) Banners
  const demoBanners = [
    { title: "Landing Banner 1", imageUrl: "/images/brand-landing-bg-banner.png", link: "/home" },
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

  return { products: createdProducts, banners: createdBanners, categories: Object.keys(categoryMap).length };
}

main()
  .then(async (summary) => {
    console.log("Seed complete:", JSON.stringify(summary, null, 2));
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

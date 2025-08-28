import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed categories
  await prisma.category.createMany({
    data: [
      { name: 'Men', description: 'Men clothing and accessories', status: true },
      { name: 'Women', description: 'Women clothing and accessories', status: true },
      { name: 'Kids', description: 'Kids clothing and accessories', status: true }
    ],
    skipDuplicates: true
  });

const products = [
  {
    title: "Classic White Tee",
    description: "100% cotton slim-fit t-shirt",
    longDescription: "A breathable everyday tee made from soft combed cotton. Holds shape after multiple washes.",
    inStock: 120,
    isActive: true,
    price: 599,
    sellingPrice: 499,
    discount: 16.7,
    gst: 5,
    homeDelivery: 25,
    keyFeature: "Soft & breathable",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "REGULAR"
  },
  {
    title: "Black Polo Shirt",
    description: "Piqué polo with ribbed collar",
    longDescription: "Smart-casual polo with premium piqué knit and two-button placket. Perfect for Friday fits.",
    inStock: 80,
    isActive: true,
    price: 999,
    sellingPrice: 849,
    discount: 15,
    gst: 5,
    homeDelivery: 25,
    keyFeature: "Piqué knit",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "TRENDING"
  },
  {
    title: "Blue Denim Jeans",
    description: "Regular fit, mid-rise",
    longDescription: "Classic 5-pocket denim with a durable twill weave. Slight stretch for all-day comfort.",
    inStock: 60,
    isActive: true,
    price: 1799,
    sellingPrice: 1499,
    discount: 16.7,
    gst: 12,
    homeDelivery: 40,
    keyFeature: "Stretch denim",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "REGULAR"
  },
  {
    title: "Slim-Fit Chinos (Khaki)",
    description: "Cotton-blend chinos",
    longDescription: "Clean silhouette chinos with tapered leg. Works with tees, shirts, and blazers alike.",
    inStock: 75,
    isActive: true,
    price: 1499,
    sellingPrice: 1299,
    discount: 13.4,
    gst: 5,
    homeDelivery: 30,
    keyFeature: "Tapered fit",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "REGULAR"
  },
  {
    title: "Athleisure Joggers (Charcoal)",
    description: "Soft terry joggers",
    longDescription: "Mid-weight terry fabric with drawstring waist and cuffed hems. Built for comfort days.",
    inStock: 90,
    isActive: true,
    price: 1299,
    sellingPrice: 1099,
    discount: 15.4,
    gst: 5,
    homeDelivery: 25,
    keyFeature: "Terry knit",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "TRENDING"
  },
  {
    title: "Zip-Up Hoodie (Grey)",
    description: "Fleece-lined hoodie",
    longDescription: "Cozy fleece interior, metal zipper, and kangaroo pockets. Your go-to layering piece.",
    inStock: 50,
    isActive: true,
    price: 1699,
    sellingPrice: 1399,
    discount: 17.7,
    gst: 5,
    homeDelivery: 35,
    keyFeature: "Warm fleece",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "REGULAR"
  },
  {
    title: "Oversized Graphic Tee",
    description: "Streetwear graphic print",
    longDescription: "Heavyweight cotton with drop shoulders and bold screen print. Statement essential.",
    inStock: 110,
    isActive: true,
    price: 899,
    sellingPrice: 749,
    discount: 16.7,
    gst: 5,
    homeDelivery: 25,
    keyFeature: "Heavyweight cotton",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "TRENDING"
  },
  {
    title: "Formal Slim Shirt (Sky Blue)",
    description: "Wrinkle-resist formal shirt",
    longDescription: "Slim profile, cutaway collar, and easy-care finish for crisp office days.",
    inStock: 70,
    isActive: true,
    price: 1299,
    sellingPrice: 1099,
    discount: 15.4,
    gst: 5,
    homeDelivery: 25,
    keyFeature: "Easy-care",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "REGULAR"
  },
  {
    title: "Summer Linen Shirt (Beige)",
    description: "Breathable linen blend",
    longDescription: "Relaxed fit with natural linen texture. Stays cool in hot, humid days.",
    inStock: 55,
    isActive: true,
    price: 1599,
    sellingPrice: 1399,
    discount: 12.5,
    gst: 5,
    homeDelivery: 30,
    keyFeature: "Linen blend",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "REGULAR"
  },
  {
    title: "Casual Twill Shorts (Navy)",
    description: "Above-knee twill shorts",
    longDescription: "Durable twill fabric with stretch and multiple pockets. Weekend essential.",
    inStock: 95,
    categoryId: 3,
    isActive: true,
    price: 999,
    sellingPrice: 849,
    discount: 15,
    gst: 5,
    homeDelivery: 20,
    keyFeature: "Stretch twill",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "REGULAR"
  }
];

const banners = [
  { 
    title: "End of Season Sale",
    imageUrl: "/uploads/banners/banner-1.png",
    link: "/sale",
    isActive: true
  },
  {
    title: "New Drops Are Here",
    imageUrl: "/uploads/banners/banner-2.png",
    link: "/new-arrivals",
    isActive: true
  }
];

 await prisma.banners.createMany({ data: banners, skipDuplicates: true });


  console.log('✅ Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
    categoryId: 1,
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
    title: "Premium MLM Polo Shirt",
    description: "High-quality piqué polo with MLM rewards",
    longDescription: "Premium polo shirt with exclusive MLM benefits. Join our community and earn rewards with every purchase!",
    inStock: 80,
    categoryId: 1,
    isActive: true,
    price: 1299,
    sellingPrice: 1099,
    discount: 15.4,
    gst: 12,
    homeDelivery: 40,
    mlmPrice: 200,
    keyFeature: "MLM Rewards",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "MLM"
  },
  {
    title: "Trending Blue Denim Jeans",
    description: "Regular fit, mid-rise trending style",
    longDescription: "Classic 5-pocket denim with a durable twill weave. Slight stretch for all-day comfort. Trending this season!",
    inStock: 60,
    categoryId: 1,
    isActive: true,
    price: 1799,
    sellingPrice: 1499,
    discount: 16.7,
    gst: 12,
    homeDelivery: 40,
    keyFeature: "Stretch denim",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "TRENDING"
  },
  {
    title: "MLM Elite Chinos",
    description: "Premium chinos with MLM commission benefits",
    longDescription: "High-quality cotton-blend chinos with exclusive MLM earning opportunities. Perfect for building your network!",
    inStock: 75,
    categoryId: 1,
    isActive: true,
    price: 1899,
    sellingPrice: 1599,
    discount: 15.8,
    gst: 12,
    homeDelivery: 50,
    mlmPrice: 300,
    keyFeature: "MLM Elite",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "MLM"
  },
  {
    title: "Athleisure Joggers (Charcoal)",
    description: "Soft terry joggers",
    longDescription: "Mid-weight terry fabric with drawstring waist and cuffed hems. Built for comfort days.",
    inStock: 90,
    categoryId: 1,
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
    title: "MLM Premium Hoodie",
    description: "Luxury hoodie with MLM rewards program",
    longDescription: "Premium fleece-lined hoodie with exclusive MLM benefits. Earn while you wear comfort!",
    inStock: 50,
    categoryId: 2,
    isActive: true,
    price: 2199,
    sellingPrice: 1899,
    discount: 13.6,
    gst: 18,
    homeDelivery: 60,
    mlmPrice: 400,
    keyFeature: "MLM Premium",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "MLM"
  },
  {
    title: "Oversized Graphic Tee",
    description: "Streetwear graphic print",
    longDescription: "Heavyweight cotton with drop shoulders and bold screen print. Statement essential.",
    inStock: 110,
    categoryId: 2,
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
    title: "MLM Business Shirt",
    description: "Professional shirt for MLM entrepreneurs",
    longDescription: "Crisp formal shirt designed for MLM business meetings. Look professional while earning commissions!",
    inStock: 70,
    categoryId: 1,
    isActive: true,
    price: 1699,
    sellingPrice: 1399,
    discount: 17.7,
    gst: 12,
    homeDelivery: 45,
    mlmPrice: 250,
    keyFeature: "MLM Business",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "MLM"
  },
  {
    title: "Summer Linen Shirt (Beige)",
    description: "Breathable linen blend",
    longDescription: "Relaxed fit with natural linen texture. Stays cool in hot, humid days.",
    inStock: 55,
    categoryId: 1,
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
    title: "Kids MLM Fun Shorts",
    description: "Colorful shorts with MLM family rewards",
    longDescription: "Fun and comfortable shorts for kids. Parents can earn MLM rewards with every purchase!",
    inStock: 95,
    categoryId: 3,
    isActive: true,
    price: 799,
    sellingPrice: 649,
    discount: 18.8,
    gst: 5,
    homeDelivery: 20,
    mlmPrice: 150,
    keyFeature: "MLM Family",
    mainImage: "/uploads/product-images/img-1.webp",
    manufacturer: "Wear & Earn",
    type: "MLM"
  }
];

// Create products
await prisma.product.createMany({ 
  data: products, 
  skipDuplicates: true 
});

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
    //await prisma.$disconnect();
  });

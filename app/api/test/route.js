import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";

// export const GET = async () => {
//   try {
//     const categories = [
//       { name: "Cord Set" },
//       { name: "Lehenga" },
//       { name: "Saree" },
//       { name: "Kurti" },
//       { name: "Co-Ord Set" },
//     ];

//     const sampleProducts = [
//       {
//         title: "Elegant Summer Wear",
//         description: "Light and breathable cotton wear",
//         longDescription: "This product is made from premium cotton...",
//         inStock: 10,
//         isActive: true,
//         discount: 10,
//         profit: 200,
//         gst: 18,
//         gatewayFee: 15,
//         homeDelivery: 50,
//         price: 1000,
//         sellingPrice: 850,
//         mainImage: "https://wearearn.kumarinfotech.net/uploads/products/img_687757e5bf3190.31899299.jpg",
//         manufacturer: "WeAreArn",
//       },
//       {
//         title: "Festive Designer Wear",
//         description: "Perfect for wedding season",
//         longDescription: "Traditional look with modern design...",
//         inStock: 8,
//         isActive: true,
//         discount: 15,
//         profit: 250,
//         gst: 12,
//         gatewayFee: 20,
//         homeDelivery: 70,
//         price: 1500,
//         sellingPrice: 1100,
//         mainImage: "https://wearearn.kumarinfotech.net/uploads/products/img_68775741612128.57042302.jpg",
//         manufacturer: "EthnicStylez",
//       },
//     ];

//     const insertedProducts = [];

//     for (const cat of categories) {
//       const createdCategory = await prisma.Category.create({
//         data: { name: cat.name },
//       });

//       // Add 2 products for each category
//       for (const productTemplate of sampleProducts) {
//         const product = await prisma.Product.create({
//           data: {
//             ...productTemplate,
//             categoryId: createdCategory.id,
//           },
//         });
//         insertedProducts.push(product);
//       }
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Seeded categories and products successfully",
//         totalProducts: insertedProducts.length,
//         data: insertedProducts,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Seed error:", error);
//     return NextResponse.json(
//       { success: false, message: "Internal Server Error", error },
//       { status: 500 }
//     );
//   }
// };


const imagesInput = [
  {
    productId: 11,
    imageUrl: "https://wearearn.kumarinfotech.net/uploads/products/img_687755f3562541.40372571.jpg",
  },
  {
    productId: 11,
    imageUrl: "https://wearearn.kumarinfotech.net/uploads/products/img_687757e5bf3190.31899299.jpg",
  },
  {
    productId: 11,
    imageUrl: "https://wearearn.kumarinfotech.net/uploads/products/img_6877527ea674d5.08428911.jpg",
  },
]

export const GET = async () => {
  try {
    const response = await prisma.ProductImage.createMany({
      data: imagesInput,
    });
   return res.json({success : true , response : response})
  } catch (error) {
    return res.json({message : error})
  }
}
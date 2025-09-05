import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { 
      title, 
      description, 
      longDescription, 
      productPrice,    // Normal product cost
      mlmPrice,        // MLM amount for pool system
      categoryId,
      keyFeature,
      manufacturer,
      images
    } = await request.json()
    
    // Calculate total price
    const totalPrice = (productPrice || 0) + (mlmPrice || 0);
    
    const product = await prisma.product.create({
      data: {
        title,
        description: description || '',
        longDescription: longDescription || '',
        productPrice: productPrice || 0,
        mlmPrice: mlmPrice || 0,
        price: totalPrice,           // Legacy field
        sellingPrice: totalPrice,    // Legacy field
        categoryId: categoryId ? parseInt(categoryId) : null,
        keyFeature,
        manufacturer,
        isActive: true, // New products are active by default
        inStock: 1
      }
    });

    // Add images if provided
    if (images && images.length > 0) {
      await Promise.all(
        images.map(imageUrl =>
          prisma.productImage.create({
            data: {
              productId: product.id,
              imageUrl
            }
          })
        )
      );
    }

    // Get created product with images
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: createdProduct.id,
        title: createdProduct.title,
        description: createdProduct.description,
        productPrice: createdProduct.productPrice,
        mlmPrice: createdProduct.mlmPrice,
        totalPrice: createdProduct.price,
        category: createdProduct.category?.name,
        images: createdProduct.images.map(img => img.imageUrl),
        isActive: createdProduct.isActive
      }
    });

  } catch (error) {
    console.error('Add product error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Update existing product
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { 
      id,
      title, 
      description, 
      longDescription, 
      productPrice,
      mlmPrice,
      categoryId,
      keyFeature,
      manufacturer,
      isActive
    } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }
    
    // Calculate total price
    const totalPrice = (productPrice || 0) + (mlmPrice || 0);
    
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        longDescription,
        productPrice: productPrice || 0,
        mlmPrice: mlmPrice || 0,
        price: totalPrice,
        sellingPrice: totalPrice,
        categoryId: categoryId ? parseInt(categoryId) : null,
        keyFeature,
        manufacturer,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        images: true,
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: updatedProduct.id,
        title: updatedProduct.title,
        description: updatedProduct.description,
        productPrice: updatedProduct.productPrice,
        mlmPrice: updatedProduct.mlmPrice,
        totalPrice: updatedProduct.price,
        category: updatedProduct.category?.name,
        images: updatedProduct.images.map(img => img.imageUrl),
        isActive: updatedProduct.isActive
      }
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

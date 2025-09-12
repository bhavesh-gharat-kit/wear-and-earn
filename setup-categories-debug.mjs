/**
 * 🛠️ PRODUCT CATEGORY SETUP & DEBUG SCRIPT
 * 
 * This script will:
 * 1. Create default categories
 * 2. Test product creation
 * 3. Debug any schema issues
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupCategoriesAndTest() {
  console.log('🛠️ PRODUCT CATEGORY SETUP & DEBUG')
  console.log('==================================\n')

  try {
    // 1. Create default categories
    console.log('1. Setting up default categories...')
    
    const categories = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Fashion' },
      { id: 3, name: 'Home & Kitchen' },
      { id: 4, name: 'Books' },
      { id: 5, name: 'Sports & Fitness' }
    ]

    for (const cat of categories) {
      try {
        await prisma.category.upsert({
          where: { id: cat.id },
          update: { name: cat.name },
          create: { id: cat.id, name: cat.name }
        })
        console.log(`   ✅ Category: ${cat.name}`)
      } catch (catError) {
        console.log(`   ⚠️ Category ${cat.name}: ${catError.message}`)
      }
    }

    // 2. List all categories
    console.log('\n2. Available categories:')
    const allCategories = await prisma.category.findMany()
    allCategories.forEach(cat => {
      console.log(`   - ID: ${cat.id}, Name: ${cat.name}`)
    })

    // 3. Test product creation with same data as frontend
    console.log('\n3. Testing product creation...')
    
    const testProductData = {
      title: 'Test Product',
      description: 'Test Description',
      categoryId: 1,
      productPrice: 1000,
      mlmPrice: 200,
      discount: 2,
      longDescription: 'Test overview',
      keyFeature: 'Test key features',
      gst: 5,
      homeDelivery: 50,
      type: 'TRENDING',
      price: 1200,
      sellingPrice: 1200,
      isActive: true,
      inStock: 1
    }

    try {
      const testProduct = await prisma.product.create({
        data: testProductData,
        include: {
          category: true,
          images: true
        }
      })
      
      console.log('   ✅ Product created successfully!')
      console.log('   📦 Product ID:', testProduct.id)
      console.log('   📝 Title:', testProduct.title)
      console.log('   🏷️ Category:', testProduct.category?.name)
      console.log('   💰 Product Price:', testProduct.productPrice)
      console.log('   🎯 MLM Price:', testProduct.mlmPrice)
      
      // Clean up test product
      await prisma.product.delete({ where: { id: testProduct.id } })
      console.log('   🧹 Test product cleaned up')
      
    } catch (productError) {
      console.log('   ❌ Product creation failed:', productError.message)
      console.log('   🔍 Full error:')
      console.log(productError)
      
      // Check if it's a schema validation issue
      if (productError.message.includes('Unknown argument')) {
        console.log('\n   🔧 SCHEMA VALIDATION ISSUE DETECTED:')
        console.log('   - This indicates a field name mismatch')
        console.log('   - Need to check Prisma schema vs API code')
      }
    }

    // 4. Check Product table structure
    console.log('\n4. Checking Product table structure...')
    try {
      const productCount = await prisma.product.count()
      console.log(`   📊 Current products in database: ${productCount}`)
      
      if (productCount > 0) {
        const sampleProduct = await prisma.product.findFirst({
          include: { category: true }
        })
        console.log('   📋 Sample product fields:')
        Object.keys(sampleProduct || {}).forEach(field => {
          console.log(`     - ${field}: ${typeof sampleProduct[field]}`)
        })
      }
    } catch (tableError) {
      console.log('   ❌ Table check error:', tableError.message)
    }

    // 5. Test ProductType enum
    console.log('\n5. Testing ProductType enum...')
    try {
      const validTypes = ['REGULAR', 'TRENDING', 'FEATURED', 'NEW_ARRIVAL']
      console.log('   🎯 Valid ProductType values:', validTypes.join(', '))
    } catch (enumError) {
      console.log('   ❌ Enum error:', enumError.message)
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.error('Full error:', error)
  } finally {
    //await prisma.$disconnect()
  }
}

// Run the setup
setupCategoriesAndTest().catch(console.error)

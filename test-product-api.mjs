/**
 * 🧪 PRODUCT API TEST SCRIPT
 * 
 * This script will test the exact same API call as the frontend
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function testProductAPI() {
  console.log('🧪 TESTING PRODUCT API')
  console.log('=====================\n')

  try {
    // Create a test FormData similar to frontend
    const formData = new FormData()
    
    // Add the exact same fields as frontend
    formData.append('title', 'test 1')
    formData.append('description', 'test 1')  
    formData.append('category', '1')
    formData.append('productPrice', '1000')
    formData.append('mlmPrice', '200')
    formData.append('discount', '2')
    formData.append('overview', 'test 1')
    formData.append('keyFeatures', 'test 1')
    formData.append('gst', '5')
    formData.append('shipping', '50')
    formData.append('productType', 'TRENDING')

    console.log('1. FormData prepared with fields:')
    for (const [key, value] of formData.entries()) {
      console.log(`   ${key}: ${value}`)
    }

    console.log('\n2. Testing API endpoint...')
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/products/add-product', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ API call successful!')
        console.log('   Product ID:', result.newProduct?.id)
        console.log('   Title:', result.newProduct?.title)
        console.log('   Category ID:', result.newProduct?.categoryId)
        
        // Clean up created product
        if (result.newProduct?.id) {
          await prisma.product.delete({ where: { id: result.newProduct.id } })
          console.log('   🧹 Test product cleaned up')
        }
      } else {
        console.log('❌ API call failed:', response.status)
        console.log('   Error message:', result.message)
        console.log('   Full error:', result.error)
        
        // Parse the Prisma error if it's there
        if (result.error && result.error.includes('Invalid `prisma.product.create()` invocation:')) {
          console.log('\n   🔍 PRISMA ERROR ANALYSIS:')
          const errorLines = result.error.split('\n')
          errorLines.forEach(line => {
            if (line.includes('Unknown argument')) {
              console.log(`   🔴 ${line.trim()}`)
            }
          })
        }
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message)
      console.log('   Make sure the server is running on http://localhost:3000')
    }

    // Test 3: Direct database insert with same data
    console.log('\n3. Testing direct database insert...')
    
    const directProductData = {
      title: 'test 1',
      description: 'test 1',
      longDescription: 'test 1', // overview
      categoryId: 1,
      productPrice: 1000,
      mlmPrice: 200,
      price: 1200, // productPrice + mlmPrice
      sellingPrice: 1200,
      discount: 2,
      keyFeature: 'test 1', // keyFeatures
      gst: 5,
      homeDelivery: 50, // shipping
      type: 'TRENDING', // productType
      isActive: true,
      inStock: 1
    }

    try {
      const directProduct = await prisma.product.create({
        data: directProductData,
        include: {
          category: true
        }
      })
      
      console.log('   ✅ Direct database insert successful!')
      console.log('   📦 Product ID:', directProduct.id)
      console.log('   📝 Title:', directProduct.title)
      console.log('   🏷️ Category:', directProduct.category?.name)
      
      // Clean up
      await prisma.product.delete({ where: { id: directProduct.id } })
      console.log('   🧹 Direct test product cleaned up')
      
    } catch (directError) {
      console.log('   ❌ Direct insert failed:', directError.message)
      console.log('   🔍 This indicates a schema issue')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testProductAPI().catch(console.error)

#!/usr/bin/env node

console.log('🧪 TESTING CORRECT PRODUCT API');
console.log('=================================');

// Test the product creation API with correct endpoint
async function testProductAPI() {
    try {
        // 1. Prepare form data
        const formData = new FormData();
        formData.append('title', 'API Test Product');
        formData.append('description', 'Testing product API');
        formData.append('category', '1'); // Electronics category ID
        formData.append('productPrice', '1000');
        formData.append('mlmPrice', '200');
        formData.append('discount', '0');
        formData.append('overview', 'Test overview');
        formData.append('keyFeatures', 'Test features');
        formData.append('gst', '18');
        formData.append('shipping', '50');
        formData.append('productType', 'TRENDING');
        formData.append('inStock', '10');

        console.log('1. FormData prepared');

        // 2. Test the CORRECT API endpoint
        console.log('2. Testing CORRECT API endpoint: /api/admin/products/add-product');
        
        const response = await fetch('http://localhost:3000/api/admin/products/add-product', {
            method: 'POST',
            body: formData,
            headers: {
                // No Content-Type header - let browser set it with boundary for FormData
            }
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ API Success! Product created:', result.newProduct.id);
        } else {
            console.log('❌ API Error:', result.message);
        }

    } catch (error) {
        console.error('❌ Fetch error:', error.message);
    }
}

// Also test direct database check
async function testDirectDB() {
    console.log('\n3. Testing direct database check...');
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // Check if categories exist
        const categories = await prisma.category.findMany({
            select: { id: true, name: true }
        });
        console.log('📂 Available categories:', categories);

        // Check latest products
        const products = await prisma.product.findMany({
            take: 3,
            orderBy: { id: 'desc' },
            select: { id: true, title: true, categoryId: true }
        });
        console.log('📦 Latest products:', products);

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

// Run tests
await testProductAPI();
await testDirectDB();

console.log('\n🏁 Test completed!');

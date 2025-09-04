const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureProductsVisibility() {
  try {
    console.log('🔍 Checking product visibility...');
    
    // 1. Check for inactive products
    const inactiveProducts = await prisma.product.findMany({
      where: { isActive: false },
      select: { id: true, title: true }
    });
    
    if (inactiveProducts.length > 0) {
      console.log(`📋 Found ${inactiveProducts.length} inactive products:`);
      inactiveProducts.forEach(p => console.log(`   - ${p.title} (ID: ${p.id})`));
      
      console.log('✅ Activating inactive products...');
      await prisma.product.updateMany({
        where: { isActive: false },
        data: { isActive: true }
      });
      console.log(`✅ Activated ${inactiveProducts.length} products`);
    } else {
      console.log('✅ All products are active');
    }
    
    // 2. Check for inactive categories
    const inactiveCategories = await prisma.category.findMany({
      where: { status: false },
      select: { id: true, name: true }
    });
    
    if (inactiveCategories.length > 0) {
      console.log(`📋 Found ${inactiveCategories.length} inactive categories:`);
      inactiveCategories.forEach(c => console.log(`   - ${c.name} (ID: ${c.id})`));
      
      console.log('✅ Activating inactive categories...');
      await prisma.category.updateMany({
        where: { status: false },
        data: { status: true }
      });
      console.log(`✅ Activated ${inactiveCategories.length} categories`);
    } else {
      console.log('✅ All categories are active');
    }
    
    // 3. Ensure products have proper defaults
    console.log('🔧 Ensuring products have proper defaults...');
    
    const productsToUpdate = await prisma.product.findMany({
      where: {
        OR: [
          { manufacturer: null },
          { gst: { lte: 0 } },
          { homeDelivery: { lte: 0 } },
          { inStock: { lte: 0 } }
        ]
      },
      select: { id: true, title: true, manufacturer: true, gst: true, homeDelivery: true, inStock: true }
    });
    
    if (productsToUpdate.length > 0) {
      console.log(`📋 Found ${productsToUpdate.length} products needing defaults:`);
      
      for (const product of productsToUpdate) {
        const updates = {};
        if (!product.manufacturer) updates.manufacturer = 'WeArEarn';
        if (product.gst <= 0) updates.gst = 18;
        if (product.homeDelivery <= 0) updates.homeDelivery = 50;
        if (product.inStock <= 0) updates.inStock = 1;
        
        if (Object.keys(updates).length > 0) {
          await prisma.product.update({
            where: { id: product.id },
            data: updates
          });
          console.log(`   ✅ Updated ${product.title}`);
        }
      }
    }
    
    // 4. Final summary
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { isActive: true } });
    const totalCategories = await prisma.category.count();
    const activeCategories = await prisma.category.count({ where: { status: true } });
    
    console.log('\n📊 Final Summary:');
    console.log(`   Products: ${activeProducts}/${totalProducts} active`);
    console.log(`   Categories: ${activeCategories}/${totalCategories} active`);
    console.log('✅ All products should now be visible on the frontend!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  ensureProductsVisibility();
}

module.exports = { ensureProductsVisibility };

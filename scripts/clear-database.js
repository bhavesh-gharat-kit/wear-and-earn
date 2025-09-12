const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Disable foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('✓ Foreign key checks disabled');

    // Get all table names from the database
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
    `;

    console.log(`📋 Found ${tables.length} tables to clear`);

    // Truncate each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${tableName}\`;`);
        console.log(`✓ Cleared table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Warning: Could not clear table ${tableName}: ${error.message}`);
      }
    }

    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✓ Foreign key checks re-enabled');

    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 All data has been deleted, table structures remain intact.');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    // Make sure to re-enable foreign keys even if something fails
    try {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (fkError) {
      console.error('❌ Could not re-enable foreign key checks:', fkError);
    }
  } finally {
    //await prisma.$disconnect();
  }
}

// Run the cleanup
clearDatabase();

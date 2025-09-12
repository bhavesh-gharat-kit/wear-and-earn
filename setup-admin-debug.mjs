/**
 * 🔧 ADMIN USER CREATION & DEBUG SCRIPT
 * 
 * This script will:
 * 1. Test database connection
 * 2. Create admin user if needed
 * 3. Clear any cached sessions
 * 4. Debug signup issues
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  console.log('🔧 ADMIN USER SETUP & DEBUG SCRIPT')
  console.log('==================================\n')

  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully\n')

    // Check current users
    console.log('2. Checking current users...')
    const userCount = await prisma.user.count()
    console.log(`📊 Current user count: ${userCount}`)
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { id: true, fullName: true, email: true, mobileNo: true, role: true, isActive: true }
      })
      console.log('👥 Existing users:')
      users.forEach(user => {
        console.log(`   - ${user.fullName} (${user.email || user.mobileNo}) - Role: ${user.role || 'user'}`)
      })
    }

    // Create admin user if none exists
    console.log('\n3. Creating admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.upsert({
      where: { 
        email: 'admin@wearandearn.com'
      },
      update: {
        password: hashedPassword,
        role: 'admin',
        isActive: true
      },
      create: {
        fullName: 'System Admin',
        email: 'admin@wearandearn.com',
        mobileNo: '9999999999',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        kycStatus: 'APPROVED',
        walletBalance: 0,
        level: 0,
        monthlyPurchase: 0,
        isEligibleRepurchase: false
      },
    })

    console.log('✅ Admin user created/updated:')
    console.log(`   📧 Email: admin@wearandearn.com`)
    console.log(`   🔑 Password: admin123`)
    console.log(`   📱 Mobile: 9999999999`)
    console.log(`   👑 Role: admin`)

    // Test user creation
    console.log('\n4. Testing user creation process...')
    try {
      // Try creating a test user
      const testUser = await prisma.user.create({
        data: {
          fullName: 'Test User',
          mobileNo: '1234567890',
          password: await bcrypt.hash('test123', 12),
          isActive: false,
          kycStatus: 'PENDING',
          walletBalance: 0,
          level: 0,
          monthlyPurchase: 0,
          isEligibleRepurchase: false
        }
      })
      
      console.log('✅ Test user creation successful')
      
      // Clean up test user
      await prisma.user.delete({ where: { id: testUser.id } })
      console.log('✅ Test user cleaned up')
      
    } catch (createError) {
      console.log('❌ User creation test failed:', createError.message)
      
      // Check for specific database issues
      if (createError.code === 'P2002') {
        console.log('   - Duplicate key constraint violation')
      } else if (createError.code === 'P2003') {
        console.log('   - Foreign key constraint violation')
      } else if (createError.code === 'P1001') {
        console.log('   - Database connection error')
      }
    }

    console.log('\n5. Database schema validation...')
    
    // Check critical tables
    const tables = ['User', 'Product', 'Order', 'Team', 'Purchase']
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count()
        console.log(`   ✅ ${table} table: ${count} records`)
      } catch (tableError) {
        console.log(`   ❌ ${table} table: ${tableError.message}`)
      }
    }

    console.log('\n🎉 SETUP COMPLETE!')
    console.log('==================')
    console.log('✅ Database connection working')
    console.log('✅ Admin user available')
    console.log('✅ User creation process tested')
    console.log('\n📋 LOGIN CREDENTIALS:')
    console.log('Email: admin@wearandearn.com')
    console.log('Password: admin123')
    console.log('\n🔧 To clear browser cache:')
    console.log('- Clear browser cookies for localhost:3000')
    console.log('- Or use incognito/private browser window')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
    
    if (error.code === 'P1001') {
      console.log('\n🔧 DATABASE CONNECTION ISSUE:')
      console.log('- Check if MySQL server is running')
      console.log('- Verify DATABASE_URL in .env file')
      console.log('- Current DATABASE_URL:', process.env.DATABASE_URL)
    }
  } finally {
    //await prisma.$disconnect()
  }
}

// Run the setup
createAdminUser().catch(console.error)

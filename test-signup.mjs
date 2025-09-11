/**
 * 🧪 SIGNUP API TEST SCRIPT
 * 
 * This script will test the signup functionality directly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSignup() {
  console.log('🧪 TESTING SIGNUP API')
  console.log('=====================\n')

  try {
    // Clear any test users first
    console.log('1. Cleaning up test users...')
    await prisma.user.deleteMany({
      where: {
        mobileNo: {
          in: ['1111111111', '2222222222']
        }
      }
    })
    console.log('✅ Test users cleaned up\n')

    // Test 1: Simple signup without referral
    console.log('2. Testing basic signup...')
    try {
      const response = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'Test User',
          email: 'test@example.com',
          mobileNo: '1111111111',
          password: 'test123'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ Basic signup successful!')
        console.log('   User ID:', result.user.id)
        console.log('   Full Name:', result.user.fullName)
        console.log('   Mobile:', result.user.mobileNo)
      } else {
        console.log('❌ Basic signup failed:', result.message)
        console.log('   Status:', response.status)
        console.log('   Details:', result)
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message)
      console.log('   Make sure the server is running on http://localhost:3000')
    }

    // Test 2: Check database
    console.log('\n3. Checking database...')
    const users = await prisma.user.findMany({
      where: {
        mobileNo: '1111111111'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNo: true,
        isActive: true,
        kycStatus: true,
        role: true
      }
    })

    if (users.length > 0) {
      console.log('✅ User found in database:')
      users.forEach(user => {
        console.log('   -', user.fullName, '(' + user.mobileNo + ')')
        console.log('     Active:', user.isActive)
        console.log('     KYC Status:', user.kycStatus)
        console.log('     Role:', user.role || 'user')
      })
    } else {
      console.log('❌ No users found in database')
    }

    // Test 3: Login test
    console.log('\n4. Testing login with new user...')
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobileNo: '1111111111',
          password: 'test123'
        })
      })

      if (loginResponse.ok) {
        console.log('✅ Login endpoint accessible')
      } else {
        console.log('⚠️ Login endpoint status:', loginResponse.status)
      }
    } catch (loginError) {
      console.log('⚠️ Login test skipped:', loginError.message)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testSignup().catch(console.error)

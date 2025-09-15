#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsersForTesting() {
  console.log('🔍 Checking available users for withdrawal testing...\n')
  
  try {
    // Find users with approved KYC
    const approvedUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'APPROVED',
        kycData: {
          status: 'approved'
        }
      },
      select: {
        id: true,
        email: true,
        walletBalance: true,
        kycStatus: true,
        kycData: {
          select: {
            status: true,
            bankName: true,
            bankAccountNumber: true
          }
        }
      }
    })

    console.log('✅ Users with approved KYC:')
    approvedUsers.forEach(user => {
      console.log(`   User ${user.id} (${user.email}):`)
      console.log(`     Balance: ₹${(user.walletBalance / 100).toFixed(2)}`)
      console.log(`     KYC Status: ${user.kycStatus}`)
      console.log(`     Bank: ${user.kycData?.bankName || 'N/A'}`)
      console.log('')
    })

    if (approvedUsers.length === 0) {
      console.log('❌ No users with approved KYC found.')
      return
    }

    // Find the user with highest balance
    const richestUser = approvedUsers.reduce((prev, current) => 
      (prev.walletBalance > current.walletBalance) ? prev : current
    )

    if (richestUser.walletBalance < 50000) { // Less than ₹500 minimum
      console.log(`⚠️  Richest user has only ₹${(richestUser.walletBalance / 100).toFixed(2)}`)
      console.log('   Adding test balance for withdrawal testing...')
      
      // Add ₹2000 to the user for testing
      await prisma.user.update({
        where: { id: richestUser.id },
        data: {
          walletBalance: {
            increment: 200000 // Add ₹2000
          }
        }
      })

      // Create ledger entry for the added balance
      await prisma.ledger.create({
        data: {
          userId: richestUser.id,
          type: 'bonus',
          amount: 200000,
          note: 'Test balance added for withdrawal testing',
          ref: `test_balance_${Date.now()}`
        }
      })

      console.log(`   ✅ Added ₹2000 to user ${richestUser.email} for testing`)
    }

    console.log('\n🧪 Now testing withdrawal workflow...')

  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsersForTesting()
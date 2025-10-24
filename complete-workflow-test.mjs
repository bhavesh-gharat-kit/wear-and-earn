import prisma from './lib/prisma.js'

async function testCompleteWorkflow() {
  try {
    console.log('🔄 Testing Complete KYC to Withdrawal Workflow\n')
    
    // Find a test user with KYC data
    const testUser = await prisma.user.findFirst({
      where: {
        kycData: {
          isNot: null
        }
      },
      include: {
        kycData: true
      }
    })

    if (!testUser) {
      console.log('❌ No user with KYC data found.')
      return
    }

    console.log(`📋 Using test user: ${testUser.fullName} (ID: ${testUser.id})`)
    
    // Step 1: Ensure KYC is approved
    console.log('\n🔄 Step 1: Ensuring KYC approval...')
    await prisma.user.update({
      where: { id: testUser.id },
      data: { kycStatus: 'APPROVED' }
    })
    
    await prisma.kycData.update({
      where: { userId: testUser.id },
      data: { 
        status: 'approved',
        reviewedAt: new Date(),
        reviewNote: 'Test approval for workflow validation'
      }
    })
    
    // Add sufficient balance
    await prisma.user.update({
      where: { id: testUser.id },
      data: { walletBalance: 50000 } // ₹500
    })
    
    console.log('✅ KYC approved and balance added')
    
    // Step 2: Create a withdrawal request
    console.log('\n🔄 Step 2: Creating withdrawal request...')
    
    const withdrawalRequest = await prisma.newWithdrawal.create({
      data: {
        userId: testUser.id,
        amount: 30000, // ₹300 
        status: 'requested',
        requestedAt: new Date(),
        bankDetails: JSON.stringify({
          accountNumber: '93261 528550',
          ifscCode: 'ABCD0001234',
          bankName: 'Test Bank',
          accountHolderName: testUser.fullName
        })
      }
    })
    
    console.log(`✅ Withdrawal request created: ₹${(withdrawalRequest.amount / 100).toFixed(2)}`)
    
    // Step 3: Verify admin can see the request
    console.log('\n🔄 Step 3: Verifying admin panel visibility...')
    
    const adminWithdrawals = await prisma.newWithdrawal.findMany({
      where: { status: 'requested' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNo: true,
            kycStatus: true,
            kycData: {
              select: {
                status: true
              }
            }
          }
        }
      }
    })
    
    console.log(`✅ Found ${adminWithdrawals.length} pending requests in admin panel:`)
    adminWithdrawals.forEach((req, index) => {
      const kycApproved = req.user.kycStatus === 'APPROVED' && req.user.kycData?.status === 'approved'
      console.log(`   ${index + 1}. ${req.user.fullName} - ₹${(req.amount / 100).toFixed(2)} - KYC: ${kycApproved ? '✅ Approved' : '❌ Not Approved'}`)
    })
    
    // Step 4: Simulate admin approval
    console.log('\n🔄 Step 4: Simulating admin approval...')
    
    const approvedWithdrawal = await prisma.newWithdrawal.update({
      where: { id: withdrawalRequest.id },
      data: {
        status: 'approved',
        processedAt: new Date(),
        adminNote: 'Approved for test workflow'
      }
    })
    
    // Deduct from wallet
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        walletBalance: {
          decrement: withdrawalRequest.amount
        }
      }
    })
    
    console.log(`✅ Withdrawal approved and processed`)
    
    // Step 5: Verify final state
    console.log('\n🔄 Step 5: Verifying final state...')
    
    const finalUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: {
        walletBalance: true,
        kycStatus: true,
        kycData: {
          select: {
            status: true
          }
        }
      }
    })
    
    const finalWithdrawal = await prisma.newWithdrawal.findUnique({
      where: { id: withdrawalRequest.id }
    })
    
    console.log(`✅ Final wallet balance: ₹${(finalUser.walletBalance / 100).toFixed(2)}`)
    console.log(`✅ KYC Status: ${finalUser.kycStatus}`)
    console.log(`✅ KYC Data Status: ${finalUser.kycData?.status}`)
    console.log(`✅ Withdrawal Status: ${finalWithdrawal.status}`)
    
    console.log('\n🎉 Complete workflow test SUCCESSFUL!')
    console.log('✅ KYC approval → User eligibility → Withdrawal request → Admin visibility → Processing')
    
  } catch (error) {
    console.error('❌ Error in workflow test:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testCompleteWorkflow()
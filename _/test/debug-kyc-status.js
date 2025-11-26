// Debug KYC status display issue
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugKYCStatus() {
  try {
    console.log('🔍 Debugging KYC Status Display Issue\n')
    
    // Find the test user
    const user = await prisma.user.findFirst({
      where: {
        kycData: { isNot: null }
      },
      include: {
        kycData: true
      }
    })
    
    if (!user) {
      console.log('❌ No user with KYC data found')
      return
    }
    
    console.log(`📋 Checking user: ${user.fullName} (ID: ${user.id})\n`)
    
    // Check database state
    console.log('🔄 Database State:')
    console.log(`   User.kycStatus: ${user.kycStatus}`)
    console.log(`   KycData.status: ${user.kycData?.status}`)
    console.log(`   KycData.reviewedAt: ${user.kycData?.reviewedAt}`)
    console.log(`   KycData.reviewNote: ${user.kycData?.reviewNote}`)
    
    // Simulate what Profile API returns
    console.log('\n🔄 Profile API Response:')
    const profileData = {
      id: user.id,
      fullName: user.fullName,
      kycStatus: user.kycStatus,
      // ... other fields
    }
    console.log(`   kycStatus: ${profileData.kycStatus}`)
    
    // Simulate what KYC API returns  
    console.log('\n🔄 KYC API Response:')
    const kycResponse = {
      success: true,
      hasKyc: !!user.kycData,
      kycData: user.kycData ? {
        status: user.kycData.status,
        submittedAt: user.kycData.submittedAt,
        reviewedAt: user.kycData.reviewedAt,
        reviewNote: user.kycData.reviewNote
      } : null
    }
    console.log(`   hasKyc: ${kycResponse.hasKyc}`)
    console.log(`   kycData.status: ${kycResponse.kycData?.status}`)
    
    // Test the account page logic
    console.log('\n🔄 Account Page Logic Test:')
    const userData = profileData
    const kycData = kycResponse.kycData
    
    console.log(`   userData?.kycStatus: ${userData?.kycStatus}`)
    console.log(`   kycData?.status: ${kycData?.status}`)
    
    const isVerified = userData?.kycStatus === 'APPROVED' && kycData?.status === 'approved'
    console.log(`   KYC Verified Check: ${isVerified}`)
    
    // Check what the UI should show
    console.log('\n📱 UI Display Logic:')
    
    if (isVerified) {
      console.log('   ✅ Should show: "KYC Verified Successfully" with green checkmark')
    } else if (kycData?.status === 'pending') {
      console.log('   🟡 Should show: "KYC Under Review" with clock icon')
    } else if (kycData?.status === 'rejected') {
      console.log('   ❌ Should show: "KYC Rejected" with rejection reasons')
    } else {
      console.log('   📝 Should show: KYC form for initial submission')
    }
    
    // Test possible issues
    console.log('\n🔍 Potential Issues:')
    
    if (userData?.kycStatus === 'APPROVED' && kycData?.status !== 'approved') {
      console.log('   ❌ ISSUE: User.kycStatus is APPROVED but KycData.status is not "approved"')
      console.log('   🔧 FIX: Check admin approval API - should update both fields')
    }
    
    if (userData?.kycStatus !== 'APPROVED' && kycData?.status === 'approved') {
      console.log('   ❌ ISSUE: KycData.status is "approved" but User.kycStatus is not APPROVED')
      console.log('   🔧 FIX: Check admin approval API - should update both fields')
    }
    
    if (!userData?.kycStatus) {
      console.log('   ❌ ISSUE: Profile API is not returning kycStatus field')
      console.log('   🔧 FIX: Check if profile API includes kycStatus in response')
    }
    
    // Check if admin approval actually worked
    console.log('\n🔄 Testing Admin Approval Simulation:')
    
    // Reset to pending first
    await prisma.user.update({
      where: { id: user.id },
      data: { kycStatus: 'PENDING' }
    })
    
    await prisma.kycData.update({
      where: { userId: user.id },
      data: { status: 'pending' }
    })
    
    console.log('   Reset to pending...')
    
    // Now approve
    await prisma.user.update({
      where: { id: user.id },
      data: { kycStatus: 'APPROVED' }
    })
    
    await prisma.kycData.update({
      where: { userId: user.id },
      data: { 
        status: 'approved',
        reviewedAt: new Date(),
        reviewNote: 'Test approval'
      }
    })
    
    console.log('   Applied approval...')
    
    // Check final state
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { kycData: true }
    })
    
    console.log(`   Final User.kycStatus: ${updatedUser.kycStatus}`)
    console.log(`   Final KycData.status: ${updatedUser.kycData?.status}`)
    
    const finalCheck = updatedUser.kycStatus === 'APPROVED' && updatedUser.kycData?.status === 'approved'
    console.log(`   Final Verification: ${finalCheck ? '✅ WORKING' : '❌ BROKEN'}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugKYCStatus()
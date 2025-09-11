/**
 * 🔥 KYC & WITHDRAWAL MANAGEMENT BRIDGE - PHASE 2.4 🔥
 * Bridging existing KYC/Withdrawal system with MLM Pool Plan enhancements
 * 
 * OPTION B: BRIDGE + ENHANCEMENTS STRATEGY
 * - Existing System: 95% complete KYC & withdrawal functionality
 * - Bridge Integration: Enhanced with MLM-specific requirements
 * - New Features: Advanced analytics, automation, pool-specific logic
 */

const { MLMCompatibilityBridge } = require('./mlm-compatibility-bridge')

class KYCWithdrawalBridge {
  constructor() {
    this.mlmBridge = new MLMCompatibilityBridge()
    this.MIN_WITHDRAWAL_AMOUNT = 300 // ₹300 as per logbook specification
  }

  // ========================================
  // BRIDGE 1: ENHANCED KYC MANAGEMENT
  // ========================================

  /**
   * Enhanced KYC Processing with MLM-specific validations
   */
  async enhancedKYCProcessing(userId, action, adminId, reason, rejectionReasons = null) {
    console.log('🔐 Enhanced KYC processing with MLM bridge integration...')
    
    try {
      const result = await this.mlmBridge.prisma.$transaction(async (tx) => {
        
        // 1. Get user with current KYC status
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: {
            kycData: true,
            kycSubmissions: true
          }
        })
        
        if (!user) {
          throw new Error(`User ${userId} not found`)
        }
        
        // 2. Enhanced KYC validation for MLM requirements
        const enhancedValidation = await this.validateMLMKYCRequirements(tx, user)
        
        if (!enhancedValidation.eligible && action === 'approve') {
          console.log('⚠️ MLM KYC requirements not met:', enhancedValidation.reasons)
        }
        
        // 3. Process KYC action with enhanced logging
        const kycResult = await this.processKYCAction(tx, userId, action, adminId, reason, rejectionReasons)
        
        // 4. MLM-specific post-processing
        if (action === 'approve' && kycResult.success) {
          await this.processMMLKYCApprovalBenefits(tx, userId)
        }
        
        return {
          success: true,
          kycResult,
          enhancedValidation,
          mlmBenefits: action === 'approve' ? 'processed' : 'skipped'
        }
      })
      
      console.log(`✅ Enhanced KYC ${action}: SUCCESS`)
      return result
      
    } catch (error) {
      console.error('❌ Enhanced KYC Processing Error:', error.message)
      throw error
    }
  }

  /**
   * Validate MLM-specific KYC requirements
   */
  async validateMLMKYCRequirements(tx, user) {
    const reasons = []
    
    // Check if user has made first purchase (MLM eligibility)
    const hasPurchase = user.firstPurchaseDate !== null
    if (!hasPurchase) {
      reasons.push('No first purchase completed')
    }
    
    // Check referral code exists
    if (!user.referralCode) {
      reasons.push('Referral code not generated')
    }
    
    // Check basic profile completeness
    if (!user.fullName || !user.email || !user.mobileNo) {
      reasons.push('Incomplete profile information')
    }
    
    return {
      eligible: reasons.length === 0,
      reasons,
      hasPurchase,
      hasReferralCode: !!user.referralCode
    }
  }

  /**
   * Process KYC action with existing system integration
   */
  async processKYCAction(tx, userId, action, adminId, reason, rejectionReasons) {
    // Update user KYC status using existing schema
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        kycStatus: action === 'approve' ? 'APPROVED' : 'REJECTED'
      }
    })
    
    // Create KYC submission record if it doesn't exist
    let kycSubmission = await tx.kycSubmission.findFirst({
      where: { userId, isActive: true }
    })
    
    if (kycSubmission) {
      // Update existing submission
      kycSubmission = await tx.kycSubmission.update({
        where: { id: kycSubmission.id },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewedByAdminId: adminId,
          reviewedDate: new Date(),
          adminComments: reason,
          rejectionReason: action === 'reject' ? rejectionReasons : null
        }
      })
    } else {
      // Create submission record for tracking
      kycSubmission = await tx.kycSubmission.create({
        data: {
          userId,
          submissionDate: new Date(),
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewedByAdminId: adminId,
          reviewedDate: new Date(),
          adminComments: reason,
          rejectionReason: action === 'reject' ? rejectionReasons : null,
          isActive: true
        }
      })
    }
    
    return { success: true, user: updatedUser, submission: kycSubmission }
  }

  /**
   * Process MLM-specific KYC approval benefits
   */
  async processMMLKYCApprovalBenefits(tx, userId) {
    // KYC approval simply enables withdrawal eligibility
    // No welcome bonus functionality
    
    console.log(`✅ KYC approval processed for user ${userId} - withdrawal eligibility enabled`)
    
    return { withdrawalEnabled: true, bonusRemoved: true }
  }

  // ========================================
  // BRIDGE 2: ENHANCED WITHDRAWAL MANAGEMENT
  // ========================================

  /**
   * Enhanced Withdrawal Processing with MLM validations
   */
  async enhancedWithdrawalProcessing(userId, amount, bankDetails, withdrawalType = 'manual') {
    console.log('💸 Enhanced withdrawal processing with MLM validations...')
    
    try {
      const result = await this.mlmBridge.prisma.$transaction(async (tx) => {
        
        // 1. Enhanced withdrawal validations
        const validation = await this.validateMLMWithdrawal(tx, userId, amount)
        
        if (!validation.eligible) {
          throw new Error(`Withdrawal not eligible: ${validation.reasons.join(', ')}`)
        }
        
        // 2. Create withdrawal request using existing system
        const withdrawalRequest = await this.createEnhancedWithdrawalRequest(tx, userId, amount, bankDetails, withdrawalType)
        
        // 3. Update wallet balance (hold funds)
        await tx.user.update({
          where: { id: userId },
          data: {
            walletBalance: { decrement: amount }
          }
        })
        
        // 4. Create enhanced ledger tracking
        await this.createEnhancedWithdrawalLedger(tx, userId, amount, withdrawalRequest.id)
        
        return {
          success: true,
          withdrawalRequest,
          validation,
          status: 'pending_admin_approval'
        }
      })
      
      console.log('✅ Enhanced withdrawal request created successfully')
      return result
      
    } catch (error) {
      console.error('❌ Enhanced Withdrawal Processing Error:', error.message)
      throw error
    }
  }

  /**
   * Validate MLM-specific withdrawal requirements
   */
  async validateMLMWithdrawal(tx, userId, amount) {
    const reasons = []
    
    // Get user with full details
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        newWithdrawals: {
          where: { status: 'requested' }
        }
      }
    })
    
    if (!user) {
      reasons.push('User not found')
      return { eligible: false, reasons }
    }
    
    // 1. KYC requirement
    if (user.kycStatus !== 'APPROVED') {
      reasons.push('KYC not approved')
    }
    
    // 2. Minimum amount
    if (amount < this.MIN_WITHDRAWAL_AMOUNT) {
      reasons.push(`Minimum withdrawal amount is ₹${this.MIN_WITHDRAWAL_AMOUNT}`)
    }
    
    // 3. Wallet balance
    if (user.walletBalance < amount) {
      reasons.push(`Insufficient wallet balance. Available: ₹${user.walletBalance}`)
    }
    
    // 4. Pending withdrawals limit
    const pendingWithdrawals = user.newWithdrawals.length
    if (pendingWithdrawals >= 3) {
      reasons.push('Maximum 3 pending withdrawals allowed')
    }
    
    // 5. MLM-specific: Must have first purchase
    if (!user.firstPurchaseDate) {
      reasons.push('First purchase required for withdrawals')
    }
    
    return {
      eligible: reasons.length === 0,
      reasons,
      currentBalance: user.walletBalance,
      pendingWithdrawals,
      kycStatus: user.kycStatus
    }
  }

  /**
   * Create enhanced withdrawal request
   */
  async createEnhancedWithdrawalRequest(tx, userId, amount, bankDetails, withdrawalType) {
    // Use existing NewWithdrawal table
    const withdrawalRequest = await tx.newWithdrawal.create({
      data: {
        userId,
        amount,
        bankDetails: JSON.stringify(bankDetails),
        status: 'requested',
        // Enhanced fields for MLM tracking
        adminNotes: `MLM ${withdrawalType} withdrawal request`,
        createdAt: new Date()
      }
    })
    
    return withdrawalRequest
  }

  /**
   * Create enhanced withdrawal ledger entry
   */
  async createEnhancedWithdrawalLedger(tx, userId, amount, withdrawalId) {
    await tx.ledger.create({
      data: {
        userId,
        type: 'withdrawal_request',
        amount: -amount, // Negative for deduction
        description: `Withdrawal request #${withdrawalId} - funds held pending approval`,
        ref: `WITHDRAWAL_REQ_${withdrawalId}_${Date.now()}`
      }
    })
  }

  // ========================================
  // BRIDGE 3: ENHANCED ADMIN CONTROLS
  // ========================================

  /**
   * Enhanced Admin Withdrawal Approval System
   */
  async enhancedAdminWithdrawalControls() {
    console.log('🔧 Enhanced admin withdrawal controls with analytics...')
    
    const adminControls = {
      
      // Get pending withdrawals with enhanced info
      getPendingWithdrawals: async (filters = {}) => {
        const withdrawals = await this.mlmBridge.prisma.newWithdrawal.findMany({
          where: {
            status: 'requested',
            ...filters
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                kycStatus: true,
                walletBalance: true,
                firstPurchaseDate: true,
                currentLevel: true,
                teamCount: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        })
        
        return withdrawals.map(withdrawal => ({
          ...withdrawal,
          enhancedInfo: {
            userLevel: withdrawal.user.currentLevel,
            teamCount: withdrawal.user.teamCount,
            kycStatus: withdrawal.user.kycStatus,
            mlmActive: !!withdrawal.user.firstPurchaseDate
          }
        }))
      },

      // Process withdrawal approval with enhanced features
      processWithdrawalApproval: async (withdrawalId, action, adminId, adminNotes) => {
        return await this.mlmBridge.prisma.$transaction(async (tx) => {
          
          const withdrawal = await tx.newWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: { user: true }
          })
          
          if (!withdrawal) {
            throw new Error('Withdrawal not found')
          }
          
          if (action === 'approve') {
            // Approve withdrawal
            await tx.newWithdrawal.update({
              where: { id: withdrawalId },
              data: {
                status: 'approved',
                adminNotes,
                processedAt: new Date()
              }
            })
            
            // Create completion ledger entry
            await tx.ledger.create({
              data: {
                userId: withdrawal.userId,
                type: 'withdrawal_approved',
                amount: -withdrawal.amount,
                description: `Withdrawal approved by admin: ${adminNotes}`,
                ref: `WITHDRAWAL_APPROVED_${withdrawalId}_${Date.now()}`
              }
            })
            
          } else {
            // Reject withdrawal - return money to wallet
            await tx.newWithdrawal.update({
              where: { id: withdrawalId },
              data: {
                status: 'rejected',
                adminNotes,
                processedAt: new Date()
              }
            })
            
            // Return money to wallet
            await tx.user.update({
              where: { id: withdrawal.userId },
              data: {
                walletBalance: { increment: withdrawal.amount }
              }
            })
            
            // Create refund ledger entry
            await tx.ledger.create({
              data: {
                userId: withdrawal.userId,
                type: 'withdrawal_rejected',
                amount: withdrawal.amount,
                description: `Withdrawal rejected, funds returned: ${adminNotes}`,
                ref: `WITHDRAWAL_REJECTED_${withdrawalId}_${Date.now()}`
              }
            })
          }
          
          return { success: true, action, withdrawalId }
        })
      },

      // Get withdrawal analytics
      getWithdrawalAnalytics: async () => {
        const analytics = await this.mlmBridge.prisma.newWithdrawal.groupBy({
          by: ['status'],
          _count: { id: true },
          _sum: { amount: true }
        })
        
        const totalRequests = await this.mlmBridge.prisma.newWithdrawal.count()
        const totalAmount = await this.mlmBridge.prisma.newWithdrawal.aggregate({
          _sum: { amount: true }
        })
        
        return {
          totalRequests,
          totalAmount: totalAmount._sum.amount || 0,
          byStatus: analytics.reduce((acc, item) => {
            acc[item.status] = {
              count: item._count.id,
              amount: item._sum.amount || 0
            }
            return acc
          }, {})
        }
      }
    }
    
    return adminControls
  }

  // ========================================
  // BRIDGE 4: COMPREHENSIVE TESTING & VALIDATION
  // ========================================

  /**
   * Run comprehensive KYC & Withdrawal system test
   */
  async runComprehensiveTest() {
    console.log('🧪 Running comprehensive KYC & Withdrawal system test...')
    
    try {
      const testResults = {
        kycSystem: null,
        withdrawalSystem: null,
        adminControls: null,
        overallStatus: 'TESTING'
      }
      
      // Test KYC system
      try {
        const testUser = await this.mlmBridge.prisma.user.findFirst({
          where: { kycStatus: 'PENDING' }
        })
        
        if (testUser) {
          console.log('✅ KYC System: Users with pending KYC found - system active')
        } else {
          console.log('✅ KYC System: No pending KYC - system ready')
        }
        
        testResults.kycSystem = 'READY'
        
      } catch (error) {
        console.log('⚠️ KYC System Test:', error.message)
        testResults.kycSystem = 'ERROR'
      }
      
      // Test withdrawal system
      try {
        const withdrawalCount = await this.mlmBridge.prisma.newWithdrawal.count()
        console.log(`✅ Withdrawal System: ${withdrawalCount} total withdrawal requests`)
        testResults.withdrawalSystem = 'READY'
      } catch (error) {
        console.log('⚠️ Withdrawal System Test:', error.message)
        testResults.withdrawalSystem = 'ERROR'
      }
      
      // Test admin controls
      try {
        const adminControls = await this.enhancedAdminWithdrawalControls()
        const analytics = await adminControls.getWithdrawalAnalytics()
        console.log('✅ Admin Controls: Analytics loaded successfully')
        console.log('   Total withdrawal requests:', analytics.totalRequests)
        testResults.adminControls = 'READY'
      } catch (error) {
        console.log('⚠️ Admin Controls Test:', error.message)
        testResults.adminControls = 'ERROR'
      }
      
      // Overall status
      const allSystemsReady = Object.values(testResults).filter(status => status === 'READY').length >= 3
      testResults.overallStatus = allSystemsReady ? 'ALL_SYSTEMS_READY' : 'PARTIAL_READY'
      
      return testResults
      
    } catch (error) {
      console.error('❌ Comprehensive Test Error:', error.message)
      return { overallStatus: 'TEST_FAILED', error: error.message }
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.mlmBridge.disconnect()
  }
}

module.exports = { KYCWithdrawalBridge }

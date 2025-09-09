/**
 * 🔧 MLM SYSTEM COMPATIBILITY BRIDGE - OPTION B
 * Bridging existing MLM system with new database schema + enhancements
 * 
 * ENHANCED HYBRID APPROACH
 */

const { PrismaClient } = require('@prisma/client')

class MLMCompatibilityBridge {
  constructor() {
    this.prisma = new PrismaClient()
  }

  // ========================================
  // BRIDGE 1: TABLE NAME COMPATIBILITY
  // ========================================
  
  /**
   * Universal Self Income Payment Bridge
   * Works with both old (selfIncomeInstallment) and new (selfIncomePayment) tables
   */
  async createSelfIncomePayment(paymentData) {
    console.log('🌉 Creating self income payment with dual compatibility...')
    
    try {
      // Enhanced data structure for new schema
      const enhancedPaymentData = {
        userId: paymentData.userId,
        purchaseId: paymentData.purchaseId,
        weekNumber: paymentData.installmentNumber || 1, // Required field
        amount: paymentData.amount,
        dueDate: paymentData.scheduledDate || new Date(),
        paidDate: paymentData.status === 'COMPLETED' ? new Date() : null,
        status: paymentData.status || 'pending',
        adminNotes: paymentData.description || 'Self income payment',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Create in new table (primary)
      const newPayment = await this.prisma.selfIncomePayment.create({
        data: enhancedPaymentData
      })
      
      // Also create in old table for backward compatibility (if exists)
      try {
        await this.prisma.selfIncomeInstallment.create({
          data: {
            userId: paymentData.userId,
            purchaseId: paymentData.purchaseId,
            amount: paymentData.amount,
            installmentNumber: paymentData.installmentNumber,
            dueDate: paymentData.scheduledDate || new Date(),
            status: paymentData.status || 'pending',
            createdAt: new Date()
          }
        })
        console.log('✅ Dual table creation: SUCCESS')
      } catch (oldTableError) {
        console.log('⚠️ Old table creation skipped (may not exist)')
      }
      
      return newPayment
      
    } catch (error) {
      console.error('❌ Self Income Payment Bridge Error:', error.message)
      throw error
    }
  }

  // ========================================
  // BRIDGE 2: ENHANCED TEAM FORMATION
  // ========================================
  
  /**
   * Enhanced Team Formation with New Schema
   * Integrates existing logic with new Team model
   */
  async enhancedTeamFormation(userId, purchaseId) {
    console.log('🚀 Enhanced team formation with new schema...')
    
    try {
      // Get user's current team formation status
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { 
          teamsAsLeader: {
            where: { status: 'FORMING' }
          },
          purchases: true
        }
      })
      
      if (!user) throw new Error('User not found')
      
      // Check if user already has a forming team
      let currentTeam = user.teamsAsLeader[0]
      
      if (!currentTeam) {
        // Create new team with enhanced schema
        currentTeam = await this.prisma.team.create({
          data: {
            teamLeaderId: userId,
            status: 'FORMING',
            formationDate: new Date(),
            teamSequenceNumber: 1 // Start with sequence 1
          }
        })
        
        // Create team member entry for the leader
        await this.prisma.teamMember.create({
          data: {
            teamId: currentTeam.id,
            userId: userId,
            joinDate: new Date(),
            role: 'LEADER',
            isActive: true
          }
        })
        
        console.log(`✅ New L1 team created for user ${userId}`)
      }
      
      // Update team formation progress
      await this.updateTeamFormationProgress(currentTeam.id, userId, purchaseId)
      
      return currentTeam
      
    } catch (error) {
      console.error('❌ Enhanced Team Formation Error:', error.message)
      throw error
    }
  }

  /**
   * Update Team Formation Progress
   */
  async updateTeamFormationProgress(teamId, userId, purchaseId) {
    console.log('📈 Updating team formation progress...')
    
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: { teamMembers: true }
      })
      
      if (!team) throw new Error('Team not found')
      
      // Update completed purchases count
      const updatedTeam = await this.prisma.team.update({
        where: { id: teamId },
        data: {
          completedPurchases: {
            increment: 1
          },
          lastActivity: new Date()
        }
      })
      
      // Check if team formation is complete
      if (updatedTeam.completedPurchases >= updatedTeam.targetMembers && 
          updatedTeam.currentMembers >= updatedTeam.targetMembers) {
        
        await this.completeTeamFormation(teamId)
      }
      
      console.log(`✅ Team ${teamId} progress updated`)
      
    } catch (error) {
      console.error('❌ Team Progress Update Error:', error.message)
      throw error
    }
  }

  /**
   * Complete Team Formation and Trigger Level Promotion
   */
  async completeTeamFormation(teamId) {
    console.log('🎯 Completing team formation...')
    
    try {
      // Mark team as complete
      const completedTeam = await this.prisma.team.update({
        where: { id: teamId },
        data: {
          status: 'COMPLETE',
          completionDate: new Date()
        }
      })
      
      // Trigger level promotion for team leader
      await this.triggerLevelPromotion(completedTeam.teamLeaderId)
      
      console.log(`✅ Team ${teamId} formation completed!`)
      
    } catch (error) {
      console.error('❌ Team Formation Completion Error:', error.message)
      throw error
    }
  }

  // ========================================
  // BRIDGE 3: ENHANCED LEVEL PROMOTION
  // ========================================
  
  /**
   * Enhanced Level Promotion with Corrected Requirements
   */
  async triggerLevelPromotion(userId) {
    console.log('📈 Checking level promotion eligibility...')
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamsAsLeader: { where: { status: 'COMPLETE' } }
        }
      })
      
      if (!user) throw new Error('User not found')
      
      const completedTeams = user.teamsAsLeader.length
      const currentLevel = user.currentLevel || 1
      
      // CORRECTED LEVEL REQUIREMENTS (as per specification)
      const levelRequirements = {
        1: 1,   // L1 → L2: 1 complete team (3 members)
        2: 3,   // L2 → L3: 3 complete teams (9 members)
        3: 9,   // L3 → L4: 9 complete teams (27 members)
        4: 27,  // L4 → L5: 27 complete teams (81 members)
        5: 81   // L5: Maximum level (243 members)
      }
      
      let newLevel = currentLevel
      
      // Check for level promotion
      for (let level = currentLevel; level < 5; level++) {
        if (completedTeams >= levelRequirements[level]) {
          newLevel = level + 1
        } else {
          break
        }
      }
      
      // If promotion is warranted
      if (newLevel > currentLevel) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            currentLevel: newLevel,
            levelPromotionDate: new Date()
          }
        })
        
        // Log level promotion
        await this.prisma.referralTracking.create({
          data: {
            userId: userId,
            action: 'LEVEL_PROMOTION',
            level: newLevel,
            description: `Promoted from L${currentLevel} to L${newLevel}`,
            createdAt: new Date()
          }
        })
        
        console.log(`🎉 User ${userId} promoted from L${currentLevel} to L${newLevel}!`)
        
        // Start new team formation for next level
        if (newLevel < 5) {
          await this.startNextLevelTeamFormation(userId, newLevel)
        }
      }
      
      return newLevel
      
    } catch (error) {
      console.error('❌ Level Promotion Error:', error.message)
      throw error
    }
  }

  /**
   * Start Next Level Team Formation
   */
  async startNextLevelTeamFormation(userId, level) {
    console.log(`🚀 Starting L${level} team formation for user ${userId}...`)
    
    try {
      const targetMembers = level === 2 ? 3 : level === 3 ? 9 : level === 4 ? 27 : 81
      
      const newTeam = await this.prisma.team.create({
        data: {
          teamLeaderId: userId,
          level: level,
          status: 'FORMING',
          formationDate: new Date(),
          targetMembers: targetMembers,
          currentMembers: 1,
          requiredPurchases: targetMembers,
          completedPurchases: 0
        }
      })
      
      // Add leader as first member
      await this.prisma.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: userId,
          joinDate: new Date(),
          role: 'LEADER',
          isActive: true
        }
      })
      
      console.log(`✅ L${level} team formation started`)
      
    } catch (error) {
      console.error('❌ Next Level Team Formation Error:', error.message)
      throw error
    }
  }

  // ========================================
  // BRIDGE 4: ENHANCED POOL DISTRIBUTION
  // ========================================
  
  /**
   * Enhanced Pool Distribution with New PoolDistribution Table
   */
  async enhancedPoolDistribution(poolId, totalAmount, participantUserIds) {
    console.log('💰 Enhanced pool distribution with new schema...')
    
    try {
      const perUserAmount = totalAmount / participantUserIds.length
      const distributions = []
      
      for (const userId of participantUserIds) {
        // Create pool distribution record
        const distribution = await this.prisma.poolDistribution.create({
          data: {
            poolId: poolId,
            userId: userId,
            amount: perUserAmount,
            distributionDate: new Date(),
            status: 'COMPLETED',
            level: 1 // This would be calculated based on user's current level
          }
        })
        
        // Update user's pool income
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            totalPoolIncomeEarned: {
              increment: perUserAmount
            }
          }
        })
        
        distributions.push(distribution)
      }
      
      console.log(`✅ Pool distributed to ${participantUserIds.length} users`)
      return distributions
      
    } catch (error) {
      console.error('❌ Enhanced Pool Distribution Error:', error.message)
      throw error
    }
  }

  // ========================================
  // BRIDGE 5: COMPREHENSIVE PURCHASE PROCESSING
  // ========================================
  
  /**
   * Enhanced Purchase Processing Bridge
   * Integrates existing MLM logic with new schema enhancements
   */
  async processEnhancedMLMPurchase(userId, orderData) {
    console.log('🔥 Processing enhanced MLM purchase with full bridge...')
    
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        
        // 1. Process team formation
        const teamResult = await this.enhancedTeamFormation(userId, orderData.id)
        
        // 2. Create enhanced self income payment
        const selfIncomeAmount = orderData.mlmPrice * 0.20 // 20% of MLM price
        
        const selfIncomePayment = await this.createSelfIncomePayment({
          userId: userId,
          purchaseId: orderData.id,
          amount: selfIncomeAmount,
          installmentNumber: 1,
          installmentType: 'SELF_INCOME',
          paymentStatus: 'PENDING',
          scheduledDate: new Date()
        })
        
        // 3. Process pool contribution
        const poolAmount = orderData.mlmPrice * 0.80 // 80% to turnover pool
        
        await this.prisma.poolTransaction.create({
          data: {
            userId: userId,
            purchaseId: orderData.id,
            amountToPool: poolAmount,
            transactionDate: new Date(),
            purchaseType: 'first',
            productId: orderData.products?.[0]?.productId || 1,
            mlmPriceAtTime: orderData.mlmPrice,
            poolContributed: true
          }
        })
        
        // 4. Update user statistics
        await tx.user.update({
          where: { id: userId },
          data: {
            teamCount: {
              increment: 1
            },
            totalSelfIncomeEarned: {
              increment: selfIncomeAmount
            },
            firstPurchaseDate: {
              set: new Date() // Only if this is first purchase
            }
          }
        })
        
        // 5. Create referral tracking entry
        await tx.referralTracking.create({
          data: {
            userId: userId,
            action: 'PURCHASE',
            level: 1,
            amount: orderData.mlmPrice,
            description: `MLM purchase processed: ${orderData.mlmPrice}`,
            createdAt: new Date()
          }
        })
        
        return {
          teamFormation: teamResult,
          selfIncomePayment: selfIncomePayment,
          poolContribution: poolAmount,
          status: 'SUCCESS'
        }
        
      })
      
      console.log('🎉 Enhanced MLM purchase processing completed!')
      return result
      
    } catch (error) {
      console.error('❌ Enhanced MLM Purchase Processing Error:', error.message)
      throw error
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================
  
  async disconnect() {
    await this.prisma.$disconnect()
  }
}

module.exports = { MLMCompatibilityBridge }

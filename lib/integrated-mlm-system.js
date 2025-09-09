/**
 * 🔥 INTEGRATED MLM SYSTEM - EXISTING + ENHANCED
 * Combining existing pool-mlm-system.js with new compatibility bridge
 * 
 * COMPLETE INTEGRATION SOLUTION
 */

const { MLMCompatibilityBridge } = require('./mlm-compatibility-bridge')

class IntegratedMLMSystem {
  constructor() {
    this.compatibilityBridge = new MLMCompatibilityBridge()
  }

  // ========================================
  // MAIN PURCHASE PROCESSING ENTRY POINT
  // ========================================
  
  /**
   * Main MLM Purchase Processing
   * Routes to appropriate system based on feature requirements
   */
  async processMLMPurchase(userId, orderData, options = {}) {
    console.log('🚀 INTEGRATED MLM SYSTEM: Processing purchase...')
    console.log('Options:', JSON.stringify(options, null, 2))
    
    try {
      const useEnhancedFeatures = options.useEnhanced || true
      
      if (useEnhancedFeatures) {
        // Use enhanced system with new schema features
        console.log('📈 Using ENHANCED system with new schema...')
        return await this.compatibilityBridge.processEnhancedMLMPurchase(userId, orderData)
        
      } else {
        // Use existing system (fallback)
        console.log('⚡ Using EXISTING system (fallback)...')
        return await this.processExistingMLMPurchase(userId, orderData)
      }
      
    } catch (error) {
      console.error('❌ Integrated MLM System Error:', error.message)
      
      // Fallback to existing system if enhanced fails
      if (options.useEnhanced) {
        console.log('🔄 Falling back to existing system...')
        return await this.processExistingMLMPurchase(userId, orderData)
      }
      
      throw error
    }
  }

  // ========================================
  // EXISTING SYSTEM INTEGRATION
  // ========================================
  
  /**
   * Process using existing MLM system logic
   * Maintained for backward compatibility
   */
  async processExistingMLMPurchase(userId, orderData) {
    console.log('⚡ Processing with existing MLM system...')
    
    try {
      // Import existing system functions
      const { 
        checkIfFirstPurchase, 
        processPoolMLMOrder,
        calculateMLMCommissions 
      } = require('./pool-mlm-system')
      
      // Process using existing logic
      const isFirstPurchase = await checkIfFirstPurchase(userId)
      
      if (isFirstPurchase) {
        console.log('🎯 First purchase detected - full MLM processing')
        const result = await processPoolMLMOrder(userId, orderData)
        return { ...result, system: 'EXISTING' }
        
      } else {
        console.log('🔄 Repeat purchase - commission calculation only')
        const commissions = await calculateMLMCommissions(userId, orderData)
        return { commissions, system: 'EXISTING' }
      }
      
    } catch (error) {
      console.error('❌ Existing System Processing Error:', error.message)
      throw error
    }
  }

  // ========================================
  // HYBRID PROCESSING MODES
  // ========================================
  
  /**
   * Smart Hybrid Processing
   * Automatically chooses best approach based on user's status
   */
  async smartHybridProcessing(userId, orderData) {
    console.log('🧠 Smart hybrid processing - analyzing user status...')
    
    try {
      const user = await this.compatibilityBridge.prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamsAsLeader: true,
          purchases: true,
          selfIncomePayments: true
        }
      })
      
      if (!user) throw new Error('User not found')
      
      // Decision logic
      const hasNewSchemaData = user.selfIncomePayments?.length > 0 || user.currentLevel
      const hasExistingTeams = user.teamsAsLeader?.length > 0
      const isFirstPurchase = user.purchases?.length === 0
      
      let processingMode = 'ENHANCED' // Default to enhanced
      
      if (!hasNewSchemaData && hasExistingTeams) {
        processingMode = 'EXISTING'
        console.log('📊 User has existing data - using existing system')
      } else if (isFirstPurchase) {
        processingMode = 'ENHANCED'
        console.log('🎯 First purchase - using enhanced system')
      } else {
        processingMode = 'HYBRID'
        console.log('🔄 Mixed data - using hybrid approach')
      }
      
      // Process accordingly
      switch (processingMode) {
        case 'ENHANCED':
          return await this.compatibilityBridge.processEnhancedMLMPurchase(userId, orderData)
          
        case 'EXISTING':
          return await this.processExistingMLMPurchase(userId, orderData)
          
        case 'HYBRID':
          return await this.processHybridMLMPurchase(userId, orderData)
          
        default:
          throw new Error('Invalid processing mode')
      }
      
    } catch (error) {
      console.error('❌ Smart Hybrid Processing Error:', error.message)
      throw error
    }
  }

  /**
   * Hybrid MLM Processing
   * Uses both systems for maximum compatibility
   */
  async processHybridMLMPurchase(userId, orderData) {
    console.log('⚡🚀 Hybrid MLM processing - best of both worlds...')
    
    try {
      // Run both systems in parallel where possible
      const [existingResult, enhancedResult] = await Promise.allSettled([
        this.processExistingMLMPurchase(userId, orderData),
        this.compatibilityBridge.processEnhancedMLMPurchase(userId, orderData)
      ])
      
      // Combine results
      const combinedResult = {
        existing: existingResult.status === 'fulfilled' ? existingResult.value : null,
        enhanced: enhancedResult.status === 'fulfilled' ? enhancedResult.value : null,
        errors: {
          existing: existingResult.status === 'rejected' ? existingResult.reason : null,
          enhanced: enhancedResult.status === 'rejected' ? enhancedResult.reason : null
        },
        mode: 'HYBRID'
      }
      
      console.log('🎉 Hybrid processing completed!')
      return combinedResult
      
    } catch (error) {
      console.error('❌ Hybrid Processing Error:', error.message)
      throw error
    }
  }

  // ========================================
  // SYSTEM HEALTH & DIAGNOSTICS
  // ========================================
  
  /**
   * System Health Check
   */
  async healthCheck() {
    console.log('🔍 Running integrated MLM system health check...')
    
    try {
      const health = {
        compatibilityBridge: 'UNKNOWN',
        existingSystem: 'UNKNOWN',
        database: 'UNKNOWN',
        integration: 'UNKNOWN'
      }
      
      // Test compatibility bridge
      try {
        await this.compatibilityBridge.prisma.user.findMany({ take: 1 })
        health.compatibilityBridge = 'HEALTHY'
      } catch (error) {
        health.compatibilityBridge = 'ERROR'
      }
      
      // Test existing system
      try {
        const { checkIfFirstPurchase } = require('./pool-mlm-system')
        await checkIfFirstPurchase(999) // Test with non-existent user
        health.existingSystem = 'HEALTHY'
      } catch (error) {
        health.existingSystem = 'ERROR'
      }
      
      // Test database connectivity
      try {
        await this.compatibilityBridge.prisma.$queryRaw`SELECT 1`
        health.database = 'HEALTHY'
      } catch (error) {
        health.database = 'ERROR'
      }
      
      // Overall integration health
      const healthyComponents = Object.values(health).filter(status => status === 'HEALTHY').length
      health.integration = healthyComponents >= 3 ? 'HEALTHY' : healthyComponents >= 2 ? 'DEGRADED' : 'CRITICAL'
      
      console.log('🎯 Health Check Results:', health)
      return health
      
    } catch (error) {
      console.error('❌ Health Check Error:', error.message)
      return { integration: 'CRITICAL', error: error.message }
    }
  }

  /**
   * System Diagnostics
   */
  async runDiagnostics() {
    console.log('🔧 Running comprehensive system diagnostics...')
    
    try {
      const diagnostics = {
        timestamp: new Date(),
        health: await this.healthCheck(),
        statistics: await this.getSystemStatistics(),
        compatibility: await this.checkSystemCompatibility()
      }
      
      console.log('📊 Diagnostics Complete')
      return diagnostics
      
    } catch (error) {
      console.error('❌ Diagnostics Error:', error.message)
      return { error: error.message }
    }
  }

  async getSystemStatistics() {
    try {
      const stats = await this.compatibilityBridge.prisma.$transaction(async (tx) => {
        const [
          totalUsers,
          totalPurchases,
          totalTeams,
          totalSelfIncomePayments,
          totalPoolTransactions
        ] = await Promise.all([
          tx.user.count(),
          tx.purchase.count(),
          tx.team.count(),
          tx.selfIncomePayment.count(),
          tx.poolTransaction.count()
        ])
        
        return {
          users: totalUsers,
          purchases: totalPurchases,
          teams: totalTeams,
          selfIncomePayments: totalSelfIncomePayments,
          poolTransactions: totalPoolTransactions
        }
      })
      
      return stats
    } catch (error) {
      console.error('❌ Statistics Error:', error.message)
      return {}
    }
  }

  async checkSystemCompatibility() {
    try {
      // Run the compatibility test from our earlier testing
      const testResult = await this.compatibilityBridge.prisma.$transaction(async (tx) => {
        const tests = {
          oldTableAccess: false,
          newTableAccess: false,
          relationshipsWork: false,
          enhancedFieldsWork: false
        }
        
        // Test old table access
        try {
          await tx.selfIncomeInstallment.findMany({ take: 1 })
          tests.oldTableAccess = true
        } catch {}
        
        // Test new table access
        try {
          await tx.selfIncomePayment.findMany({ take: 1 })
          tests.newTableAccess = true
        } catch {}
        
        // Test relationships
        try {
          await tx.user.findMany({ take: 1, include: { purchases: true } })
          tests.relationshipsWork = true
        } catch {}
        
        // Test enhanced fields
        try {
          await tx.user.findMany({ take: 1, select: { currentLevel: true, teamCount: true } })
          tests.enhancedFieldsWork = true
        } catch {}
        
        return tests
      })
      
      return testResult
    } catch (error) {
      console.error('❌ Compatibility Check Error:', error.message)
      return {}
    }
  }

  // ========================================
  // CLEANUP & DISCONNECTION
  // ========================================
  
  async disconnect() {
    await this.compatibilityBridge.disconnect()
  }
}

module.exports = { IntegratedMLMSystem }

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Helper function to generate unique referral code
export function generateReferralCode() {
  return crypto.randomUUID().slice(0, 8).toUpperCase()
}

// BFS algorithm to find open slot in matrix
export async function bfsFindOpenSlot(parentId) {
  const queue = [parentId]
  
  while (queue.length > 0) {
    const currentParentId = queue.shift()
    
    // Check if current parent has available positions (1, 2, 3)
    const children = await prisma.matrixNode.findMany({
      where: { parentId: currentParentId },
      orderBy: { position: 'asc' }
    })
    
    // Find first available position
    for (let position = 1; position <= 3; position++) {
      const existingChild = children.find(child => child.position === position)
      if (!existingChild) {
        return { parentId: currentParentId, position }
      }
    }
    
    // If all positions filled, add children to queue for next level
    children.forEach(child => queue.push(child.userId))
  }
  
  // Fallback - should not happen in a well-designed system
  return { parentId, position: 1 }
}

// Get company root user ID
export async function getGlobalRootId() {
  // Assuming user with ID 1 is the company root
  // You can adjust this based on your system design
  const root = await prisma.user.findFirst({
    where: { role: 'admin' },
    orderBy: { id: 'asc' }
  })
  return root?.id || 1
}

// Get uplines up to specified depth
export async function getUplines(userId, maxDepth = 7) {
  const uplines = []
  let currentUserId = userId
  
  for (let depth = 1; depth <= maxDepth; depth++) {
    const matrixNode = await prisma.matrixNode.findUnique({
      where: { userId: currentUserId },
      include: { parent: true }
    })
    
    if (!matrixNode?.parentId) break
    
    uplines.push({
      userId: matrixNode.parentId,
      depth
    })
    
    currentUserId = matrixNode.parentId
  }
  
  return uplines
}

// Activate user and place in matrix (called on first paid order)
export async function activateUserInMLM(userId, orderId, tx = prisma) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, sponsorId: true, isActive: true, referralCode: true }
  })
  
  if (!user) throw new Error('User not found')
  if (user.isActive) return user // Already activated
  
  // Generate referral code and activate user
  const referralCode = generateReferralCode()
  await tx.user.update({
    where: { id: userId },
    data: {
      isActive: true,
      referralCode
    }
  })
  
  // Find placement slot
  const rootId = user.sponsorId ? user.sponsorId : await getGlobalRootId()
  const slot = await bfsFindOpenSlot(rootId)
  
  // Create matrix node
  await tx.matrixNode.create({
    data: {
      userId,
      parentId: slot.parentId,
      position: slot.position
    }
  })
  
  // Update hierarchy (add relationships up to 7 levels)
  const uplines = await getUplines(slot.parentId, 7)
  for (const upline of uplines) {
    await tx.hierarchy.create({
      data: {
        ancestorId: upline.userId,
        descendantId: userId,
        depth: upline.depth
      }
    })
  }
  
  return { ...user, referralCode, isActive: true }
}

// Check if user meets 3x3 team requirement
export async function checkThreeByThreeRule(userId) {
  // Get direct referrals (level 1)
  const directReferrals = await prisma.hierarchy.findMany({
    where: {
      ancestorId: userId,
      depth: 1
    },
    include: {
      descendant: {
        select: { id: true, isActive: true }
      }
    }
  })
  
  // Check if at least 3 direct referrals are active
  const activeDirectReferrals = directReferrals.filter(
    ref => ref.descendant.isActive
  )
  
  if (activeDirectReferrals.length < 3) return false
  
  // Check if each of the 3 direct referrals has at least 3 active members in their team
  let qualifiedReferrals = 0
  
  for (const directRef of activeDirectReferrals.slice(0, 3)) {
    const teamSize = await prisma.hierarchy.count({
      where: {
        ancestorId: directRef.descendantId,
        descendant: { isActive: true }
      }
    })
    
    if (teamSize >= 3) {
      qualifiedReferrals++
    }
  }
  
  return qualifiedReferrals >= 3
}

// Joining commission distribution (first paid order)
export async function distributeJoiningCommission(userId, orderId, commissionAmount, tx = prisma) {
  const commissionInPaisa = Math.round(commissionAmount * 100)
  
  // Company gets 25%
  const companyShare = Math.round(commissionInPaisa * 0.25)
  await tx.ledger.create({
    data: {
      userId: null, // company
      type: 'company_fund',
      ref: `${orderId}:company`,
      amount: companyShare,
      note: `Company commission from order ${orderId}`
    }
  })
  
  // Remaining 75% split: 70% to uplines, 30% to self (weekly)
  const remainingAmount = commissionInPaisa - companyShare
  const uplineShare = Math.round(remainingAmount * 0.70)
  const selfShare = Math.round(remainingAmount * 0.30)
  
  // Distribute to uplines (70% of 75%)
  const uplines = await getUplines(userId, 7)
  const levelPercentages = [0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.05] // Total = 70%
  
  for (let i = 0; i < uplines.length && i < 7; i++) {
    const levelCommission = Math.round(uplineShare * levelPercentages[i] / 0.70) // Normalize to actual upline share
    
    // Credit to upline wallet
    await tx.user.update({
      where: { id: uplines[i].userId },
      data: { walletBalance: { increment: levelCommission } }
    })
    
    // Record in ledger
    await tx.ledger.create({
      data: {
        userId: uplines[i].userId,
        type: 'sponsor_commission',
        ref: `${orderId}:level${uplines[i].depth}`,
        amount: levelCommission,
        levelDepth: uplines[i].depth,
        note: `Level ${uplines[i].depth} commission from order ${orderId}`
      }
    })
  }
  
  // Schedule self payment (30% over 4 weeks)
  const weeklyAmount = Math.round(selfShare / 4)
  const today = new Date()
  
  for (let week = 1; week <= 4; week++) {
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + (week * 7))
    
    await tx.selfPayoutSchedule.create({
      data: {
        userId,
        orderId,
        amount: weeklyAmount,
        dueAt: dueDate
      }
    })
  }
}

// Repurchase commission distribution
export async function distributeRepurchaseCommission(userId, orderId, commissionAmount, tx = prisma) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      isKycApproved: true,
      monthlyPurchase: true,
      kycData: { select: { status: true } }
    }
  })
  
  // Check eligibility: 3x3 rule + ₹500+ monthly + KYC
  const hasThreeByThree = await checkThreeByThreeRule(userId)
  const hasMinPurchase = user.monthlyPurchase >= 50000 // ₹500 in paisa
  const isKycApproved = user.isKycApproved && user.kycData?.status === 'approved'
  
  if (!hasThreeByThree || !hasMinPurchase || !isKycApproved) {
    // Not eligible - rollup to company
    const commissionInPaisa = Math.round(commissionAmount * 100)
    await tx.ledger.create({
      data: {
        userId: null,
        type: 'rollup_to_company',
        ref: `${orderId}:rollup`,
        amount: commissionInPaisa,
        note: `Ineligible repurchase commission rolled to company from order ${orderId}`
      }
    })
    return
  }
  
  const commissionInPaisa = Math.round(commissionAmount * 100)
  
  // Company gets 25%
  const companyShare = Math.round(commissionInPaisa * 0.25)
  await tx.ledger.create({
    data: {
      userId: null,
      type: 'company_fund',
      ref: `${orderId}:company_repurchase`,
      amount: companyShare,
      note: `Company repurchase commission from order ${orderId}`
    }
  })
  
  // Distribute 75% to uplines with repurchase percentages
  const uplineShare = commissionInPaisa - companyShare
  const uplines = await getUplines(userId, 7)
  const levelPercentages = [0.25, 0.20, 0.15, 0.15, 0.10, 0.10, 0.05] // Total = 100% of upline share
  
  for (let i = 0; i < uplines.length && i < 7; i++) {
    const levelCommission = Math.round(uplineShare * levelPercentages[i])
    
    // Credit to upline wallet
    await tx.user.update({
      where: { id: uplines[i].userId },
      data: { walletBalance: { increment: levelCommission } }
    })
    
    // Record in ledger
    await tx.ledger.create({
      data: {
        userId: uplines[i].userId,
        type: 'repurchase_commission',
        ref: `${orderId}:repurchase_level${uplines[i].depth}`,
        amount: levelCommission,
        levelDepth: uplines[i].depth,
        note: `Level ${uplines[i].depth} repurchase commission from order ${orderId}`
      }
    })
  }
}

// Process weekly self payouts
export async function processWeeklySelfPayouts() {
  const today = new Date()
  
  const duePendingPayouts = await prisma.selfPayoutSchedule.findMany({
    where: {
      dueAt: { lte: today },
      status: 'scheduled'
    },
    include: {
      user: { select: { id: true, isActive: true } }
    }
  })
  
  for (const payout of duePendingPayouts) {
    if (payout.user.isActive) {
      await prisma.$transaction(async (tx) => {
        // Credit user wallet
        await tx.user.update({
          where: { id: payout.userId },
          data: { walletBalance: { increment: payout.amount } }
        })
        
        // Record in ledger
        await tx.ledger.create({
          data: {
            userId: payout.userId,
            type: 'self_joining_instalment',
            ref: `payout:${payout.id}`,
            amount: payout.amount,
            note: `Weekly self payout instalment for order ${payout.orderId}`
          }
        })
        
        // Mark as paid
        await tx.selfPayoutSchedule.update({
          where: { id: payout.id },
          data: { status: 'paid' }
        })
      })
    } else {
      // User inactive - skip payout
      await prisma.selfPayoutSchedule.update({
        where: { id: payout.id },
        data: { status: 'skipped' }
      })
    }
  }
}

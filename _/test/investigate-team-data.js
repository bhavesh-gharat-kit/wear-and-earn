/**
 * Database investigation script to understand the current team structure
 */

const { PrismaClient } = require('@prisma/client');

async function investigateTeamData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Investigating Team Data Structure\n');
    
    // Check users with sponsorId (referrals)
    const usersWithSponsors = await prisma.user.count({
      where: {
        sponsorId: { not: null }
      }
    });
    
    console.log(`👥 Users with sponsors (referrals): ${usersWithSponsors}`);
    
    // Check purchases
    const totalPurchases = await prisma.purchase.count();
    const firstPurchases = await prisma.purchase.count({
      where: { type: 'first' }
    });
    
    console.log(`💰 Total purchases: ${totalPurchases}`);
    console.log(`🎯 First purchases: ${firstPurchases}`);
    
    // Check users who have made referrals
    const usersWithReferrals = await prisma.user.findMany({
      where: {
        referrals: {
          some: {}
        }
      },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            referrals: true
          }
        }
      },
      take: 5
    });
    
    console.log(`\n🌟 Users with referrals (top 5):`);
    usersWithReferrals.forEach(user => {
      console.log(`  ${user.email}: ${user._count.referrals} referrals`);
    });
    
    // Check if any referrals have purchases
    if (usersWithReferrals.length > 0) {
      const testUserId = usersWithReferrals[0].id;
      console.log(`\n🔬 Checking referrals for user: ${usersWithReferrals[0].email}`);
      
      const referrals = await prisma.user.findMany({
        where: {
          sponsorId: testUserId
        },
        select: {
          id: true,
          email: true,
          isActive: true,
          _count: {
            select: {
              purchases: true
            }
          },
          purchases: {
            select: {
              type: true,
              mlmAmount: true,
              createdAt: true
            },
            take: 2
          }
        }
      });
      
      console.log(`📋 Their referrals:`);
      referrals.forEach(referral => {
        console.log(`  ${referral.email}: ${referral._count.purchases} purchases (${referral.isActive ? 'Active' : 'Inactive'})`);
        if (referral.purchases.length > 0) {
          referral.purchases.forEach(purchase => {
            console.log(`    - ${purchase.type} purchase: MLM $${purchase.mlmAmount} (${purchase.createdAt})`);
          });
        }
      });
    }
    
    // Check purchase types
    const purchaseTypes = await prisma.purchase.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });
    
    console.log(`\n📊 Purchase types:`);
    purchaseTypes.forEach(type => {
      console.log(`  ${type.type}: ${type._count.type} purchases`);
    });

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateTeamData();
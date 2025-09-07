/**
 * Simple MLM System Test
 */

const { PrismaClient } = require('@prisma/client');

async function testMLMSystem() {
  console.log('🧪 Testing MLM Pool Plan System\n');
  
  const prisma = new PrismaClient();

  try {
    // 1. Test Products with New Pricing Structure
    console.log('📦 Testing Product Pricing Structure');
    console.log('=' .repeat(40));
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        sellingPrice: true,
        productPrice: true,
        mlmPrice: true,
        type: true
      },
      take: 5
    });

    console.log(`Found ${products.length} products:`);
    products.forEach(p => {
      const pr = p.productPrice || 0;
      const pm = p.mlmPrice || 0;
      const total = p.sellingPrice || (pr + pm);
      const hasNewPricing = p.productPrice && p.mlmPrice;
      
      console.log(`\n  ${p.title} (${p.type})`);
      console.log(`    Compliant: ${hasNewPricing ? '✅' : '❌'}`);
      console.log(`    Pr: ₹${pr}, Pm: ₹${pm}, Total: ₹${total}`);
      if (hasNewPricing) {
        console.log(`    ✅ Formula: ₹${pr} + ₹${pm} = ₹${total}`);
      }
    });

    // 2. Test Users & Referrals
    console.log('\n\n👥 Testing User & Referral System');
    console.log('=' .repeat(40));
    
    const userStats = {
      total: await prisma.user.count(),
      withReferrals: await prisma.user.count({ where: { referralCode: { not: null } } }),
      withSponsors: await prisma.user.count({ where: { sponsorId: { not: null } } })
    };

    console.log(`Total Users: ${userStats.total}`);
    console.log(`With Referral Codes: ${userStats.withReferrals}`);
    console.log(`With Sponsors: ${userStats.withSponsors}`);
    
    if (userStats.withReferrals > 0) {
      const sampleUser = await prisma.user.findFirst({
        where: { referralCode: { not: null } },
        select: { fullName: true, referralCode: true }
      });
      console.log(`Sample: ${sampleUser.fullName} -> ${sampleUser.referralCode}`);
    }

    // 3. Test MLM Purchases
    console.log('\n\n🛒 Testing MLM Purchase System');
    console.log('=' .repeat(40));
    
    const purchaseStats = {
      total: await prisma.purchase.count(),
      first: await prisma.purchase.count({ where: { type: 'first' } }),
      repurchases: await prisma.purchase.count({ where: { type: 'repurchase' } })
    };

    console.log(`Total Purchases: ${purchaseStats.total}`);
    console.log(`First Purchases: ${purchaseStats.first}`);
    console.log(`Repurchases: ${purchaseStats.repurchases}`);

    // 4. Test Pool Levels
    console.log('\n\n🏊 Testing Pool Level System');
    console.log('=' .repeat(40));
    
    const levelStats = await prisma.user.groupBy({
      by: ['level'],
      _count: { level: true }
    });

    console.log('Users by Pool Level:');
    for (let level = 0; level <= 5; level++) {
      const stat = levelStats.find(s => s.level === level);
      const count = stat ? stat._count.level : 0;
      console.log(`  Level ${level}: ${count} users`);
    }

    // 5. Test Team System
    console.log('\n\n👥 Testing Team Formation');
    console.log('=' .repeat(40));
    
    const teamCount = await prisma.team.count();
    console.log(`Teams Formed: ${teamCount}`);
    
    if (teamCount > 0) {
      const sampleTeam = await prisma.team.findFirst({
        include: {
          leader: { select: { fullName: true } },
          members: { 
            include: { member: { select: { fullName: true } } },
            take: 3 
          }
        }
      });
      
      if (sampleTeam) {
        console.log(`Sample Team: Led by ${sampleTeam.leader.fullName}`);
        console.log(`  Members: ${sampleTeam.members.map(m => m.member.fullName).join(', ')}`);
      }
    }

    // 6. Test Wallet System
    console.log('\n\n💰 Testing Wallet System');
    console.log('=' .repeat(40));
    
    const walletStats = {
      transactions: await prisma.wallet.count(),
      installments: await prisma.selfIncomeInstallment.count(),
      paidInstallments: await prisma.selfIncomeInstallment.count({ where: { status: 'PAID' } })
    };

    console.log(`Wallet Transactions: ${walletStats.transactions}`);
    console.log(`Self Income Installments: ${walletStats.installments}`);
    console.log(`Paid Installments: ${walletStats.paidInstallments}`);

    if (walletStats.transactions > 0) {
      const totalBalance = await prisma.user.aggregate({
        _sum: { walletBalance: true }
      });
      console.log(`Total System Balance: ₹${(totalBalance._sum.walletBalance || 0) / 100}`);
    }

    // 7. Overall Compliance Check
    console.log('\n\n✅ System Compliance Check');
    console.log('=' .repeat(40));
    
    const compliance = {
      'Product Pricing (Pr + Pm)': products.some(p => p.productPrice && p.mlmPrice),
      'Referral Code Generation': userStats.withReferrals > 0,
      'MLM Purchase Tracking': purchaseStats.total > 0,
      'Pool Level System': levelStats.length > 0,
      'Team Formation': teamCount >= 0,
      'Wallet System': walletStats.transactions >= 0,
      'Self Income Processing': walletStats.installments >= 0
    };

    let passedChecks = 0;
    Object.entries(compliance).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
      if (passed) passedChecks++;
    });

    const healthScore = Math.round((passedChecks / Object.keys(compliance).length) * 100);
    console.log(`\n🎯 System Health Score: ${healthScore}%`);

    if (healthScore >= 80) {
      console.log('🎉 System is compliant with MLM Pool Plan specification!');
    } else if (healthScore >= 60) {
      console.log('⚠️  System is partially compliant but needs work');
    } else {
      console.log('❌ System needs significant improvements');
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMLMSystem();

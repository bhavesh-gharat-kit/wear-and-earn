import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * MLM System Diagnostics API
 * Provides comprehensive system health checks for MLM functionality
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Run comprehensive diagnostics
    const diagnostics = await runMLMDiagnostics();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: diagnostics.overallHealth,
      diagnostics
    });
    
  } catch (error) {
    console.error('MLM diagnostics error:', error);
    return NextResponse.json(
      { error: 'Failed to run diagnostics', details: error.message },
      { status: 500 }
    );
  }
}

async function runMLMDiagnostics() {
  const results = {
    overallHealth: 'healthy',
    issues: [],
    warnings: [],
    stats: {}
  };

  try {
    // 1. Database Connectivity
    await prisma.$queryRaw`SELECT 1`;
    results.database = 'connected';
    
    // 2. User Statistics
    const userStats = await prisma.user.groupBy({
      by: ['isActive'],
      _count: { id: true }
    });
    
    results.stats.users = {
      total: await prisma.user.count(),
      active: userStats.find(s => s.isActive)?._count?.id || 0,
      inactive: userStats.find(s => !s.isActive)?._count?.id || 0
    };
    
    // 3. MLM Tree Health
    const matrixNodes = await prisma.matrixNode.count();
    const hierarchyEntries = await prisma.hierarchy.count();
    
    results.stats.mlm = {
      matrixNodes,
      hierarchyEntries,
      avgDepth: matrixNodes > 0 ? (hierarchyEntries / matrixNodes).toFixed(2) : 0
    };
    
    // 4. Commission System
    const commissionStats = await prisma.commission.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    results.stats.commissions = commissionStats.map(c => ({
      type: c.type,
      count: c._count.id,
      totalAmount: c._sum.amount
    }));
    
    // 5. Payout Schedule
    const payoutStats = await prisma.selfPayoutSchedule.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    results.stats.payouts = payoutStats.map(p => ({
      status: p.status,
      count: p._count.id
    }));
    
    // 6. Financial Integrity
    const totalWalletBalance = await prisma.user.aggregate({
      _sum: { walletBalance: true }
    });
    
    const totalLedgerBalance = await prisma.ledger.aggregate({
      _sum: { amount: true }
    });
    
    results.stats.financial = {
      totalWalletBalance: totalWalletBalance._sum.walletBalance || 0,
      totalLedgerBalance: totalLedgerBalance._sum.amount || 0,
      balanceMatch: totalWalletBalance._sum.walletBalance === totalLedgerBalance._sum.amount
    };
    
    // 7. Check for Orphaned Users
    const orphanedUsers = await prisma.user.count({
      where: {
        isActive: true,
        node: null
      }
    });
    
    if (orphanedUsers > 0) {
      results.warnings.push(`${orphanedUsers} active users without matrix placement`);
    }
    
    // 8. Check for Inconsistent Hierarchy
    const invalidHierarchy = await prisma.hierarchy.count({
      where: {
        depth: { gt: 5 }
      }
    });
    
    if (invalidHierarchy > 0) {
      results.issues.push(`${invalidHierarchy} hierarchy entries exceed 5-level limit`);
      results.overallHealth = 'warning';
    }
    
    // 9. Check for Pending Withdrawals
    const pendingWithdrawals = await prisma.withdrawalRequest.count({
      where: { status: 'pending' }
    });
    
    results.stats.withdrawals = {
      pending: pendingWithdrawals
    };
    
    if (pendingWithdrawals > 10) {
      results.warnings.push(`${pendingWithdrawals} pending withdrawal requests`);
    }
    
    // 10. Recent Activity
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    results.stats.recentActivity = {
      ordersLast24h: recentOrders
    };
    
    // Determine overall health
    if (results.issues.length > 0) {
      results.overallHealth = 'critical';
    } else if (results.warnings.length > 0) {
      results.overallHealth = 'warning';
    }
    
  } catch (error) {
    results.overallHealth = 'critical';
    results.issues.push(`Diagnostic error: ${error.message}`);
  }
  
  return results;
}

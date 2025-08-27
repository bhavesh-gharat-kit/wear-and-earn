import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Health Check API
 * Used by Vercel and monitoring services to check if the application is running
 */
export async function GET() {
  try {
    // Test database connection
    const dbCheck = await prisma.$queryRaw`SELECT 1 as health`;
    
    // Get basic system stats
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        users: userCount,
        orders: orderCount
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected'
      },
      { status: 503 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

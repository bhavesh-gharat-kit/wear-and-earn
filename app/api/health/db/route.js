import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db-utils';

export async function GET(request) {
  try {
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      return NextResponse.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        error: health.error,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
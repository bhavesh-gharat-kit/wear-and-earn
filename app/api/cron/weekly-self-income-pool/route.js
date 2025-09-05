import { NextResponse } from 'next/server'
import { processWeeklySelfIncome } from '@/lib/pool-mlm-system'

export async function POST(request) {
  try {
    // Verify cron secret (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting weekly self income processing...');
    
    const result = await processWeeklySelfIncome();

    console.log('✅ Weekly self income processing completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Weekly self income processed successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Weekly self income processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Manual trigger for testing (admin only)
export async function GET(request) {
  try {
    const result = await processWeeklySelfIncome();

    return NextResponse.json({
      success: true,
      message: 'Manual weekly self income processing completed',
      data: result
    });

  } catch (error) {
    console.error('Manual weekly self income error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

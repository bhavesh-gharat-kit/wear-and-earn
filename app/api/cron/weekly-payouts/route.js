import { NextResponse } from 'next/server'
import { processWeeklySelfPayouts } from '@/lib/mlm-utils'

export async function POST(request) {
  try {
    // Verify cron job authorization (you might want to add API key validation)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-cron-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting weekly self payout processing...')
    await processWeeklySelfPayouts()
    console.log('Weekly self payout processing completed')

    return NextResponse.json({ 
      success: true, 
      message: 'Weekly self payouts processed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error processing weekly self payouts:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Manual trigger for testing (admin use)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await processWeeklySelfPayouts()

    return NextResponse.json({ 
      success: true, 
      message: 'Manual weekly payout processing completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in manual payout processing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

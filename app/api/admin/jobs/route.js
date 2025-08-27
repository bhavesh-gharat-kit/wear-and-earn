import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import mlmScheduler from '@/lib/jobs/scheduler'

/**
 * Admin Job Management API
 * Allows administrators to monitor and control scheduled jobs
 */

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const jobName = searchParams.get('job')

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: mlmScheduler.getJobStatus(jobName)
        })

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '20')
        return NextResponse.json({
          success: true,
          data: mlmScheduler.getJobHistory(jobName, limit)
        })

      case 'health':
        const health = await mlmScheduler.getSystemHealth()
        return NextResponse.json({
          success: true,
          data: health
        })

      default:
        // Return overview of all jobs
        return NextResponse.json({
          success: true,
          data: {
            jobs: mlmScheduler.getJobStatus(),
            recentHistory: mlmScheduler.getJobHistory(null, 10),
            systemHealth: await mlmScheduler.getSystemHealth()
          }
        })
    }

  } catch (error) {
    console.error('Error in job management API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, jobName, enable } = await request.json()

    if (!action || !jobName) {
      return NextResponse.json(
        { error: 'Missing required fields: action, jobName' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'trigger':
        const result = await mlmScheduler.triggerJob(jobName)
        return NextResponse.json({
          success: true,
          message: `Job ${jobName} executed manually`,
          data: result
        })

      case 'toggle':
        mlmScheduler.toggleJob(jobName, enable !== false)
        return NextResponse.json({
          success: true,
          message: `Job ${jobName} ${enable !== false ? 'enabled' : 'disabled'}`
        })

      case 'restart-scheduler':
        mlmScheduler.stopAll()
        mlmScheduler.initialize()
        return NextResponse.json({
          success: true,
          message: 'Job scheduler restarted'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in job management action:', error)
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

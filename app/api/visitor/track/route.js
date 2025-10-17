import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"

export async function POST(request) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    let ipAddress = forwarded ? forwarded.split(',')[0] : realIp

    // Fallback to connection remote address if no forwarded headers
    if (!ipAddress) {
      // For localhost/development
      ipAddress = '127.0.0.1'
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || ''
    
    // Get additional data from request body (optional)
    const body = await request.json().catch(() => ({}))
    const { country, city } = body

    // Check if this IP visited in the last hour to avoid duplicate entries
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentVisit = await prisma.visitor.findFirst({
      where: {
        ipAddress: ipAddress,
        timestamp: {
          gte: oneHourAgo
        }
      }
    })

    // Only create new entry if no recent visit from this IP
    if (!recentVisit) {
      const visitor = await prisma.visitor.create({
        data: {
          ipAddress: ipAddress,
          userAgent: userAgent,
          country: country || null,
          city: city || null,
          timestamp: new Date()
        }
      })

      console.log(`📊 New visitor tracked: IP ${ipAddress} at ${new Date().toISOString()}`)
    }

    // Get total visitor count for response
    const totalVisitors = await prisma.visitor.count()
    
    return NextResponse.json({
      success: true,
      message: recentVisit ? 'Visit already tracked recently' : 'Visit tracked successfully',
      totalVisitors: totalVisitors,
      ipAddress: ipAddress // For debugging (remove in production)
    })

  } catch (error) {
    console.error('Error tracking visitor:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to track visitor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve visitor statistics (for admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h' // 24h, 7d, 30d, all

    let whereClause = {}
    
    if (timeframe !== 'all') {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 24 * 7 : 24 * 30
      const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000)
      whereClause.timestamp = { gte: timeAgo }
    }

    // Get visitor count for the timeframe
    const totalVisitors = await prisma.visitor.count({ where: whereClause })
    
    // Get unique visitors (unique IP addresses) for the timeframe
    const uniqueVisitors = await prisma.visitor.groupBy({
      by: ['ipAddress'],
      where: whereClause
    })

    // Get recent visitors (last 10)
    const recentVisitors = await prisma.visitor.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        ipAddress: true,
        country: true,
        city: true,
        timestamp: true
      }
    })

    // Get hourly visitor data for the last 24 hours (for charts)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const hourlyStats = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as visits,
        COUNT(DISTINCT ipAddress) as unique_visitors
      FROM visitors 
      WHERE timestamp >= ${last24Hours}
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
      ORDER BY hour DESC
    `

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        totalVisitors,
        uniqueVisitors: uniqueVisitors.length,
        recentVisitors,
        hourlyStats: Array.isArray(hourlyStats) ? hourlyStats : []
      }
    })

  } catch (error) {
    console.error('Error fetching visitor statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch visitor statistics',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where conditions
    const where = {};
    
    if (level && level !== 'all') {
      where.leader = {
        level: parseInt(level)
      };
    }

    if (status === 'active') {
      where.isComplete = true;
    } else if (status === 'inactive') {
      where.isComplete = false;
    }

    // Get teams with pagination
    const teams = await prisma.team.findMany({
      where,
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            level: true,
            teamCount: true,
            isActive: true
          }
        },
        members: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.team.count({ where });

    // Format teams data
    const formattedTeams = teams.map(team => ({
      id: team.id,
      leaderName: team.leader.fullName,
      leaderEmail: team.leader.email,
      level: team.leader.level,
      teamCount: team.leader.teamCount,
      isActive: team.leader.isActive,
      isComplete: team.isComplete,
      memberCount: team.members.length,
      createdAt: team.createdAt,
      members: team.members.map(m => ({
        id: m.user.id,
        name: m.user.fullName,
        email: m.user.email
      }))
    }));

    return NextResponse.json({
      success: true,
      teams: formattedTeams,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

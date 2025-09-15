import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where conditions for users with referrals
    const where = {
      level: { gte: 1 }, // Only L1+ users
      referrals: {
        some: {
          purchases: {
            some: {
              type: 'first' // Only referrals who made first purchases
            }
          }
        }
      }
    };

    if (level && level !== "all") {
      where.level = parseInt(level);
    }

    // Get users with their eligible referrals (those who made first purchases)
    const users = await prisma.user.findMany({
      where,
      include: {
        referrals: {
          where: {
            purchases: {
              some: {
                type: 'first'
              }
            }
          },
          include: {
            purchases: {
              where: { type: 'first' },
              select: {
                id: true,
                createdAt: true,
                mlmAmount: true
              },
              take: 1
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        level: 'desc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    // Format user referral data with team status
    const formattedData = users.map((user) => {
      const eligibleReferrals = user.referrals.length;
      const isTeamComplete = eligibleReferrals >= 3;
      
      return {
        id: user.id,
        leaderName: user.fullName,
        leaderEmail: user.email,
        level: user.level,
        teamCount: user.teamCount,
        directTeams: user.directTeams,
        isActive: user.isActive,
        
        // Team Status Information
        teamStatus: isTeamComplete ? 'COMPLETE' : 'INCOMPLETE',
        eligibleReferrals: eligibleReferrals,
        requiredReferrals: 3,
        progressPercentage: Math.min((eligibleReferrals / 3) * 100, 100),
        
        referrals: user.referrals.map((referral) => ({
          id: referral.id,
          name: referral.fullName,
          email: referral.email,
          firstPurchaseDate: referral.purchases[0]?.createdAt || null,
          mlmAmount: (referral.purchases[0]?.mlmAmount || 0) / 100, // Convert paisa to rupees
          isEligible: true // All these referrals are eligible (made first purchase)
        })),
        totalReferralValue: user.referrals.reduce((sum, ref) => 
          sum + (ref.purchases[0]?.mlmAmount || 0), 0
        ) / 100 // Convert paisa to rupees
      };
    });

    // Separate complete and incomplete teams
    const completeTeams = formattedData.filter(user => user.teamStatus === 'COMPLETE');
    const incompleteTeams = formattedData.filter(user => user.teamStatus === 'INCOMPLETE');

    // Format data for frontend compatibility
    const teams = formattedData.map(user => ({
      id: user.id,
      leaderName: user.leaderName,
      leaderEmail: user.leaderEmail,
      level: user.level,
      teamCount: user.teamCount || 0,
      directTeams: user.directTeams || 0,
      isActive: user.isActive,
      isComplete: user.teamStatus === 'COMPLETE',
      memberCount: user.eligibleReferrals,
      createdAt: new Date().toISOString(), // Format as ISO string for frontend
      members: user.referrals.map(ref => ({
        id: ref.id,
        name: ref.name,
        email: ref.email
      })) || []
    }));

    return NextResponse.json({
      success: true,
      teams, // Main teams array expected by frontend
      completeTeams,
      incompleteTeams,
      allUsers: formattedData, // For backward compatibility
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalEligibleUsers: totalCount,
        totalCompleteTeams: completeTeams.length,
        totalIncompleteTeams: incompleteTeams.length,
        totalReferrals: formattedData.reduce((sum, user) => sum + user.eligibleReferrals, 0),
        levelBreakdown: formattedData.reduce((acc, user) => {
          const levelKey = `L${user.level}`;
          acc[levelKey] = (acc[levelKey] || 0) + 1;
          return acc;
        }, {}),
        teamStatusBreakdown: {
          complete: completeTeams.length,
          incomplete: incompleteTeams.length
        }
      }
    });
  } catch (error) {
    console.error("Error fetching referral data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

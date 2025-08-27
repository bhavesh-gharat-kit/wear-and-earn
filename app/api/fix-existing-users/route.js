import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";


export async function POST(req) {
  try {
    // Find all users who have delivered orders but no referral code or inactive status
    const problematicUsers = await prisma.user.findMany({
      where: {
        AND: [
          { orders: { some: { status: 'delivered' } } },
          {
            OR: [
              { referralCode: null },
              { isActive: false }
            ]
          }
        ]
      },
      include: {
        orders: {
          where: { status: 'delivered' },
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      }
    });

    console.log(`Found ${problematicUsers.length} users with paid orders but no MLM activation`);

    const results = [];

    for (const user of problematicUsers) {
      try {
        // Call internal activation API for each user
        const activateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/activate-mlm-internal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            orderId: user.orders[0]?.id,
            amount: user.orders[0]?.amount
          })
        });

        const result = await activateResponse.json();
        
        results.push({
          userId: user.id,
          fullName: user.fullName,
          success: result.success,
          message: result.message,
          referralCode: result.user?.referralCode
        });

        console.log(`Processed user ${user.id}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        console.error(`Failed to process user ${user.id}:`, error);
        results.push({
          userId: user.id,
          fullName: user.fullName,
          success: false,
          message: `Error: ${error.message}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${problematicUsers.length} users`,
      results
    });

  } catch (error) {
    console.error('Bulk fix error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

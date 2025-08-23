import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    console.log('Starting comprehensive fix for users with multiple purchases...');
    
    // Find ALL users who have delivered orders but are not properly activated
    const problematicUsers = await prisma.user.findMany({
      where: {
        AND: [
          { orders: { some: { status: 'delivered' } } },
          {
            OR: [
              { referralCode: null },
              { referralCode: '' },
              { isActive: false }
            ]
          }
        ]
      },
      include: {
        orders: {
          where: { status: 'delivered' },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log(`Found ${problematicUsers.length} users needing MLM activation`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of problematicUsers) {
      try {
        const orderCount = user.orders.length;
        console.log(`Processing user ${user.id} (${user.fullName}) with ${orderCount} delivered orders...`);

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
        
        if (result.success) {
          successCount++;
          console.log(`✅ Successfully activated user ${user.id} with ${orderCount} orders`);
        } else {
          failureCount++;
          console.log(`❌ Failed to activate user ${user.id}: ${result.message}`);
        }
        
        results.push({
          userId: user.id,
          fullName: user.fullName,
          orderCount: orderCount,
          success: result.success,
          message: result.message,
          referralCode: result.user?.referralCode,
          issue: !user.referralCode ? 'NO_REFERRAL_CODE' : !user.isActive ? 'INACTIVE' : 'OTHER'
        });

      } catch (error) {
        failureCount++;
        console.error(`Failed to process user ${user.id}:`, error);
        results.push({
          userId: user.id,
          fullName: user.fullName,
          orderCount: user.orders.length,
          success: false,
          message: `Error: ${error.message}`,
          issue: 'PROCESSING_ERROR'
        });
      }
    }

    console.log(`\n=== BATCH PROCESSING COMPLETE ===`);
    console.log(`Total users processed: ${problematicUsers.length}`);
    console.log(`Successful activations: ${successCount}`);
    console.log(`Failed activations: ${failureCount}`);

    return NextResponse.json({
      success: true,
      message: `Batch processing complete: ${successCount} successful, ${failureCount} failed out of ${problematicUsers.length} users`,
      summary: {
        totalProcessed: problematicUsers.length,
        successful: successCount,
        failed: failureCount
      },
      results: results.sort((a, b) => b.orderCount - a.orderCount) // Sort by order count descending
    });

  } catch (error) {
    console.error('Batch fix error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

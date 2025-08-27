// Example API route demonstrating MLM tree functionality
// app/api/mlm/tree-management/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  bfsFindOpenSlot, 
  placeNewUserInMLMTree, 
  getUplineAncestors, 
  getMatrixStats 
} from '@/lib/mlm-tree';
import { completeUserOnboarding, getUserMLMDashboard } from '@/lib/mlm-integration';

// GET: Find open slot in matrix
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    
    switch (action) {
      case 'find-open-slot':
        const rootUserId = parseInt(searchParams.get('rootUserId') || '1');
        const openSlot = await bfsFindOpenSlot(rootUserId);
        
        return NextResponse.json({
          success: true,
          data: openSlot
        });
        
      case 'get-upline':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId is required for upline query'
          }, { status: 400 });
        }
        
        const upline = await getUplineAncestors(parseInt(userId));
        
        return NextResponse.json({
          success: true,
          data: upline
        });
        
      case 'get-stats':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId is required for stats query'
          }, { status: 400 });
        }
        
        const stats = await getMatrixStats(parseInt(userId));
        
        return NextResponse.json({
          success: true,
          data: stats
        });
        
      case 'get-dashboard':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId is required for dashboard query'
          }, { status: 400 });
        }
        
        const dashboard = await getUserMLMDashboard(parseInt(userId));
        
        return NextResponse.json({
          success: true,
          data: dashboard
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: find-open-slot, get-upline, get-stats, get-dashboard'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('MLM Tree Management API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST: Place user in matrix or complete onboarding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'place-user':
        const { userId, sponsorId } = body;
        
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId is required'
          }, { status: 400 });
        }
        
        const placement = await placeNewUserInMLMTree(parseInt(userId), sponsorId ? parseInt(sponsorId) : undefined);
        
        return NextResponse.json({
          success: true,
          data: placement
        });
        
      case 'complete-onboarding':
        const { userData, sponsorReferralCode } = body;
        
        if (!userData || !userData.fullName || !userData.mobileNo) {
          return NextResponse.json({
            success: false,
            error: 'userData with fullName and mobileNo is required'
          }, { status: 400 });
        }
        
        const onboardingResult = await completeUserOnboarding(userData, sponsorReferralCode);
        
        return NextResponse.json({
          success: true,
          data: onboardingResult
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: place-user, complete-onboarding'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('MLM Tree Management POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/*
Example API usage:

1. Find open slot:
GET /api/mlm/tree-management?action=find-open-slot&rootUserId=1

2. Get user upline:
GET /api/mlm/tree-management?action=get-upline&userId=123

3. Get matrix stats:
GET /api/mlm/tree-management?action=get-stats&userId=123

4. Get MLM dashboard:
GET /api/mlm/tree-management?action=get-dashboard&userId=123

5. Place user in matrix:
POST /api/mlm/tree-management
{
  "action": "place-user",
  "userId": 123,
  "sponsorId": 45
}

6. Complete user onboarding:
POST /api/mlm/tree-management
{
  "action": "complete-onboarding",
  "userData": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "mobileNo": "9876543210",
    "password": "hashedPassword",
    "gender": "male"
  },
  "sponsorReferralCode": "ABC123"
}
*/

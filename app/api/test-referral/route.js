import { NextResponse } from 'next/server';
import { generateReferralCode, generateAndAssignReferralCode } from '@/lib/referral';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test basic code generation
    const testCode = generateReferralCode();
    console.log('Generated test code:', testCode);

    // Find a user who needs a referral code (for demo)
    const userWithoutCode = await prisma.user.findFirst({
      where: {
        OR: [
          { referralCode: null },
          { referralCode: '' }
        ]
      },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        isActive: true
      }
    });

    let assignmentResult = null;
    if (userWithoutCode) {
      try {
        const assignedCode = await generateAndAssignReferralCode(prisma, userWithoutCode.id);
        assignmentResult = {
          userId: userWithoutCode.id,
          fullName: userWithoutCode.fullName,
          assignedCode,
          success: true
        };
      } catch (error) {
        assignmentResult = {
          userId: userWithoutCode.id,
          fullName: userWithoutCode.fullName,
          error: error.message,
          success: false
        };
      }
    }

    return NextResponse.json({
      success: true,
      testCode,
      codeLength: testCode.length,
      userTest: assignmentResult,
      message: 'Referral code generation test completed'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}

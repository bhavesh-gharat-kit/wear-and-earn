import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)
    const body = await request.json()
    
    const {
      fullName,
      dateOfBirth,
      gender,
      fatherName,
      aadharNumber,
      panNumber,
      bankAccountNumber,
      ifscCode,
      bankName,
      branchName
    } = body

    // Validate required fields
    if (!fullName || !dateOfBirth || !aadharNumber || !panNumber || !bankAccountNumber || !ifscCode) {
      return NextResponse.json(
        { error: 'Missing required KYC fields' },
        { status: 400 }
      )
    }

    // Check if user already has KYC data
    const existingKyc = await prisma.kycData.findUnique({
      where: { userId: userId }
    })

    let kycData
    if (existingKyc) {
      // Update existing KYC data
      kycData = await prisma.kycData.update({
        where: { userId: userId },
        data: {
          fullName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          fatherName,
          aadharNumber,
          panNumber,
          bankAccountNumber,
          ifscCode,
          bankName,
          branchName,
          status: 'pending',
          submittedAt: new Date()
        }
      })
    } else {
      // Create new KYC data
      kycData = await prisma.kycData.create({
        data: {
          userId: userId,
          fullName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          fatherName,
          aadharNumber,
          panNumber,
          bankAccountNumber,
          ifscCode,
          bankName,
          branchName,
          status: 'pending',
          submittedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'KYC data submitted successfully',
      kycData: {
        id: kycData.id,
        status: kycData.status,
        fullName: kycData.fullName,
        dateOfBirth: kycData.dateOfBirth,
        gender: kycData.gender,
        fatherName: kycData.fatherName,
        submittedAt: kycData.submittedAt
      }
    })

  } catch (error) {
    console.error('Error submitting KYC:', error)
    return NextResponse.json(
      { error: 'Failed to submit KYC data' },
      { status: 500 }
    )
  } finally {
    //await prisma.$disconnect()
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // Get user KYC data
    const kycData = await prisma.kycData.findUnique({
      where: { userId: userId }
    })

    if (!kycData) {
      return NextResponse.json({
        success: true,
        hasKyc: false,
        message: 'No KYC data found'
      })
    }

    return NextResponse.json({
      success: true,
      hasKyc: true,
      kycData: {
        id: kycData.id,
        fullName: kycData.fullName,
        dateOfBirth: kycData.dateOfBirth,
        gender: kycData.gender,
        fatherName: kycData.fatherName,
        status: kycData.status,
        submittedAt: kycData.submittedAt,
        reviewedAt: kycData.reviewedAt,
        reviewNote: kycData.reviewNote,
        // Don't send sensitive data like Aadhar, PAN, bank details to frontend
        hasBankDetails: !!(kycData.bankAccountNumber && kycData.ifscCode),
        hasDocuments: !!(kycData.aadharNumber && kycData.panNumber)
      }
    })

  } catch (error) {
    console.error('Error fetching KYC data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KYC data' },
      { status: 500 }
    )
  } finally {
    //await prisma.$disconnect()
  }
}

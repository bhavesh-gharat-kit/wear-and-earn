import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNo: true,
        role: true,
        createdAt: true
      }
    });

    if (adminUser) {
      return NextResponse.json({
        success: true,
        message: 'Admin user exists',
        admin: adminUser
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No admin user found'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Admin user already exists'
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: 'admin@wearnearn.com',
        mobileNo: 'admin',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isKycApproved: true,
        referralCode: 'ADMIN001'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        userId: 'admin',
        password: 'admin123',
        email: 'admin@wearnearn.com'
      },
      admin: {
        id: adminUser.id,
        fullName: adminUser.fullName,
        email: adminUser.email,
        mobileNo: adminUser.mobileNo
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

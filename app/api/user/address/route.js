import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const address = await prisma.address.findUnique({
      where: {
        userId: parseInt(session.user.id)
      }
    });

    return NextResponse.json({
      success: true,
      address
    });

  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      houseNumber,
      area,
      landmark,
      villageOrCity,
      taluka,
      district,
      pinCode,
      state
    } = body;

    // Validate required fields
    if (!area || !villageOrCity || !taluka || !district || !pinCode || !state) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate PIN code
    if (!/^\d{6}$/.test(pinCode.toString())) {
      return NextResponse.json(
        { success: false, message: 'Invalid PIN code' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Check if address already exists, if yes update it, otherwise create new
    const existingAddress = await prisma.address.findUnique({
      where: { userId }
    });

    let address;
    if (existingAddress) {
      address = await prisma.address.update({
        where: { userId },
        data: {
          houseNumber: houseNumber || null,
          area,
          landmark: landmark || null,
          villageOrCity,
          taluka,
          district,
          pinCode: parseInt(pinCode),
          state
        }
      });
    } else {
      address = await prisma.address.create({
        data: {
          userId,
          houseNumber: houseNumber || null,
          area,
          landmark: landmark || null,
          villageOrCity,
          taluka,
          district,
          pinCode: parseInt(pinCode),
          state
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: existingAddress ? 'Address updated successfully' : 'Address created successfully',
      address
    });

  } catch (error) {
    console.error('Error saving address:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

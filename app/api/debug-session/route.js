import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session,
      sessionUserId: session?.user?.id,
      userRole: session?.user?.role,
      sessionType: typeof session?.user?.id,
      isAdmin: session?.user?.id === "admin" || session?.user?.role === "admin"
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error checking session', details: error.message },
      { status: 500 }
    );
  }
}

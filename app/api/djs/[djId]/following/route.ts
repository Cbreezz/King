import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ djId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ isFollowing: false });
    }

    const { djId } = await context.params;

    const following = await prisma.fanFollowing.findUnique({
      where: {
        userId_djId: {
          userId: session.user.id,
          djId
        }
      }
    });

    return NextResponse.json({
      isFollowing: !!following
    });

  } catch (error) {
    console.error('Error checking following status:', error);
    return NextResponse.json({ isFollowing: false });
  }
} 
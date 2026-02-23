import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ djId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { djId } = await context.params;

    // Check if DJ exists
    const dj = await prisma.dj.findUnique({
      where: { id: djId }
    });

    if (!dj) {
      return NextResponse.json({ error: 'DJ not found' }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.fanFollowing.findUnique({
      where: {
        userId_djId: {
          userId: session.user.id,
          djId
        }
      }
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this DJ' },
        { status: 400 }
      );
    }

    // Create the follow relationship
    await prisma.fanFollowing.create({
      data: {
        userId: session.user.id,
        djId
      }
    });

    // Update DJ fans count
    await prisma.dj.update({
      where: { id: djId },
      data: {
        fans: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully followed DJ'
    });

  } catch (error) {
    console.error('Error following DJ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ djId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { djId } = await context.params;

    // Remove the follow relationship
    const deleted = await prisma.fanFollowing.deleteMany({
      where: {
        userId: session.user.id,
        djId
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Not following this DJ' },
        { status: 400 }
      );
    }

    // Update DJ fans count
    await prisma.dj.update({
      where: { id: djId },
      data: {
        fans: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed DJ'
    });

  } catch (error) {
    console.error('Error unfollowing DJ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
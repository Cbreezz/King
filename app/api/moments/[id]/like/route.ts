import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: momentId } = await params;

    // Check if user already liked this moment
    const existingLike = await prisma.momentLike.findUnique({
      where: {
        momentId_userId: {
          momentId,
          userId: session.user.id
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this moment' },
        { status: 400 }
      );
    }

    // Create the like
    await prisma.momentLike.create({
      data: {
        momentId,
        userId: session.user.id
      }
    });

    // Get updated like count
    const likeCount = await prisma.momentLike.count({
      where: { momentId }
    });

    return NextResponse.json({
      success: true,
      liked: true,
      likeCount
    });

  } catch (error) {
    console.error('Error liking moment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: momentId } = await params;

    // Remove the like
    await prisma.momentLike.deleteMany({
      where: {
        momentId,
        userId: session.user.id
      }
    });

    // Get updated like count
    const likeCount = await prisma.momentLike.count({
      where: { momentId }
    });

    return NextResponse.json({
      success: true,
      liked: false,
      likeCount
    });

  } catch (error) {
    console.error('Error unliking moment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
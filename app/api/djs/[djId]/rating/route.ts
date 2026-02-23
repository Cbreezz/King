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
      return NextResponse.json({ rating: null });
    }

    const { djId } = await context.params;

    const userRating = await prisma.djRating.findUnique({
      where: {
        userId_djId: {
          userId: session.user.id,
          djId
        }
      }
    });

    return NextResponse.json({
      rating: userRating?.rating || null
    });

  } catch (error) {
    console.error('Error getting user rating:', error);
    return NextResponse.json({ rating: null });
  }
}

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
    const { rating } = await request.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if DJ exists
    const dj = await prisma.dj.findUnique({
      where: { id: djId }
    });

    if (!dj) {
      return NextResponse.json({ error: 'DJ not found' }, { status: 404 });
    }

    // Create or update the rating
    await prisma.djRating.upsert({
      where: {
        userId_djId: {
          userId: session.user.id,
          djId
        }
      },
      create: {
        userId: session.user.id,
        djId,
        rating
      },
      update: {
        rating
      }
    });

    // Calculate new average rating
    const allRatings = await prisma.djRating.findMany({
      where: { djId },
      select: { rating: true }
    });

    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

    // Update DJ's average rating
    await prisma.dj.update({
      where: { id: djId },
      data: { rating: averageRating }
    });

    return NextResponse.json({
      success: true,
      newRating: averageRating,
      userRating: rating
    });

  } catch (error) {
    console.error('Error rating DJ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
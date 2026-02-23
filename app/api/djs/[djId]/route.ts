import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Helper function to validate ID
function isValidId(id: string | undefined): id is string {
  return typeof id === 'string' && id.length > 0;
}

// Type for PATCH request body
interface UpdateDJBody {
  genres?: string[];
  bio?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  location?: string;
  status?: 'OFFLINE' | 'PERFORMING' | 'SCHEDULED' | 'ON_BREAK';
  currentClub?: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ djId: string }> }
) {
  try {
    const { djId } = await context.params;
    console.log('Attempting to fetch DJ with ID:', djId);

    if (!isValidId(djId)) {
      return NextResponse.json(
        { error: 'Invalid DJ ID provided' },
        { status: 400 }
      );
    }

    console.log('Validated DJ ID, attempting database query');
    const dj = await prisma.dj.findUnique({
      where: { id: djId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            location: true,
            bio: true,
            joinDate: true
          }
        },
        events: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 5,
          include: {
            club: {
              select: {
                name: true,
                location: true
              }
            }
          }
        },
        ratings: {
          select: {
            rating: true,
            user: {
              select: {
                name: true
              }
            },
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        fanFollowers: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!dj) {
      return NextResponse.json(
        { error: 'DJ not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating = dj.ratings.length > 0 
      ? dj.ratings.reduce((sum, rating) => sum + rating.rating, 0) / dj.ratings.length
      : 0;

    // Update DJ's rating if it's different
    if (Math.abs(dj.rating - averageRating) > 0.1) {
      await prisma.dj.update({
        where: { id: djId },
        data: { rating: averageRating }
      });
    }

    const djData = {
      ...dj,
      rating: averageRating,
      fans: dj.fanFollowers.length,
      totalRatings: dj.ratings.length
    };

    return NextResponse.json(djData);

  } catch (error) {
    console.error('Error fetching DJ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ djId: string }> }
) {
  try {
    const { djId } = await context.params;
    if (!isValidId(djId)) {
      return NextResponse.json(
        { error: 'Invalid DJ ID provided' },
        { status: 400 }
      );
    }

    const body = await request.json() as UpdateDJBody;

    // Validate genres array if provided
    if (body.genres && (!Array.isArray(body.genres) || !body.genres.every(g => typeof g === 'string'))) {
      return NextResponse.json(
        { error: 'Genres must be an array of strings' },
        { status: 400 }
      );
    }

    // Only include defined fields in the update
    const data: Prisma.DjUpdateInput = {
      ...(body.genres && { genres: body.genres }),
      ...(body.bio && { bio: body.bio }),
      ...(body.instagram && { instagram: body.instagram }),
      ...(body.twitter && { twitter: body.twitter }),
      ...(body.facebook && { facebook: body.facebook }),
      ...(body.status && { status: body.status }),
      ...(body.currentClub !== undefined && { currentClub: body.currentClub }),
      ...(body.location && {
        user: {
          update: {
            location: body.location
          }
        }
      })
    };

    const updatedDj = await prisma.dj.update({
      where: { 
        id: djId 
      },
      data,
      include: {
        user: {
          select: {
            name: true,
            image: true,
            location: true
          }
        },
        fanFollowers: {
          select: {
            userId: true
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedDj.id,
      userId: updatedDj.userId,
      genres: updatedDj.genres,
      bio: updatedDj.bio,
      rating: updatedDj.rating,
      status: updatedDj.status,
      currentClub: updatedDj.currentClub,
      socialLinks: {
        instagram: updatedDj.instagram,
        twitter: updatedDj.twitter,
        facebook: updatedDj.facebook
      },
      fans: updatedDj.fans,
      fanFollowers: updatedDj.fanFollowers.length,
      user: updatedDj.user
    });

  } catch (error) {
    console.error('Error updating DJ:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'DJ not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update DJ' },
      { status: 500 }
    );
  }
}

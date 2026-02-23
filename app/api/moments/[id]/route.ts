import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moment = await prisma.moment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            username: true
          }
        },
        likes: {
          select: {
            userId: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!moment) {
      return NextResponse.json(
        { error: 'Moment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(moment);
  } catch (error) {
    console.error('Error fetching moment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moment' },
      { status: 500 }
    );
  }
} 
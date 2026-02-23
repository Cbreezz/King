import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const userId = searchParams.get('userId');
    const take = limit ? Math.min(Math.max(parseInt(limit), 1), 100) : undefined;

    // If userId is provided, return the club for that owner (used for /clubs/manage)
    if (userId) {
      const club = await prisma.club.findUnique({
        where: { userId },
        include: {
          events: {
            where: { date: { gte: new Date() } },
            orderBy: { date: 'asc' },
            take: 20,
            include: {
              dj: {
                select: {
                  id: true,
                  user: { select: { name: true, image: true } },
                },
              },
            },
          },
        },
      });

      if (!club) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 });
      }

      return NextResponse.json(club);
    }
    
    const clubs = await prisma.club.findMany({
      take,
      where: { isActive: true },
      orderBy: {
        rating: 'desc'
      },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        description: true,
        rating: true,
        capacity: true,
        dresscode: true,
        amenities: true,
        phone: true,
        website: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        openingHours: true,
        events: {
          where: { date: { gte: new Date() } },
          include: {
            dj: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 1
        }
      }
    });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    
    // Return empty array instead of error object to prevent frontend map() errors
    return NextResponse.json([], { status: 200 });
  }
} 

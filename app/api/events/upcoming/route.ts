import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

function parseLimit(value: string | null, fallback: number) {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), 100);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get('limit'), 20);
    const clubId = searchParams.get('clubId');
    const djId = searchParams.get('djId');

    const where: Prisma.EventWhereInput = {
      date: { gte: new Date() },
      ...(clubId ? { clubId } : {}),
      ...(djId ? { djId } : {}),
    };

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      take: limit,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        dj: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[Events] Failed to load upcoming events:', error);
    return NextResponse.json({ events: [] }, { status: 200 });
  }
}


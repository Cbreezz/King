import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'CLUB_OWNER') {
      return NextResponse.json({ error: 'Club owner access required' }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const djId = typeof body?.djId === 'string' ? body.djId : '';
    const dateRaw = body?.date;

    if (!name || !djId || !dateRaw) {
      return NextResponse.json(
        { error: 'Missing required fields: name, djId, date' },
        { status: 400 }
      );
    }

    const date = new Date(dateRaw);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    if (date.getTime() < Date.now() + 60_000) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      );
    }

    const club = await prisma.club.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club profile not found' }, { status: 404 });
    }

    const dj = await prisma.dj.findUnique({
      where: { id: djId },
      select: { id: true },
    });

    if (!dj) {
      return NextResponse.json({ error: 'DJ not found' }, { status: 404 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        date,
        clubId: club.id,
        djId: dj.id,
      },
      include: {
        club: { select: { id: true, name: true, location: true } },
        dj: { select: { id: true, user: { select: { name: true, image: true } } } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('[Events] Failed to create event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


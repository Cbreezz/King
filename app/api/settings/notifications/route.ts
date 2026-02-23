import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const booleanFields = [
  'emailNotifications',
  'pushNotifications',
  'djLiveNotifications',
  'newFollowerNotifications',
  'eventReminders',
  'chatMentions',
  'momentLikes',
  'systemUpdates',
] as const;

type PreferenceKey = (typeof booleanFields)[number];

function pickBooleanUpdates(body: any) {
  const updates: Partial<Record<PreferenceKey, boolean>> = {};
  for (const key of booleanFields) {
    if (typeof body?.[key] === 'boolean') {
      updates[key] = body[key];
    }
  }
  return updates;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pref = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: {
      id: session.user.id,
      userId: session.user.id,
    },
    update: {},
  });

  return NextResponse.json({ preferences: pref });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const updates = pickBooleanUpdates(body);

  const pref = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: {
      id: session.user.id,
      userId: session.user.id,
      ...updates,
    },
    update: updates,
  });

  return NextResponse.json({ preferences: pref });
}


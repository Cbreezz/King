import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST - Add or remove a reaction
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, emoji, action } = body; // action: 'add' or 'remove'

    if (!messageId || !emoji || !action) {
      return NextResponse.json(
        { error: 'messageId, emoji, and action are required' },
        { status: 400 }
      );
    }

    // Verify message exists and is in the correct room
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        roomId,
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (action === 'add') {
      // Add reaction (upsert to handle duplicates)
      await prisma.messageReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId: session.user.id,
            emoji,
          }
        },
        update: {}, // No update needed if it exists
        create: {
          messageId,
          userId: session.user.id,
          emoji,
        }
      });
    } else if (action === 'remove') {
      // Remove reaction
      await prisma.messageReaction.deleteMany({
        where: {
          messageId,
          userId: session.user.id,
          emoji,
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add" or "remove"' },
        { status: 400 }
      );
    }

    // Get updated reactions for the message
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Transform reactions to match frontend format
    const transformedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction.userId);
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json({
      success: true,
      messageId,
      reactions: transformedReactions,
    });

  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json(
      { error: 'Failed to handle reaction' },
      { status: 500 }
    );
  }
} 
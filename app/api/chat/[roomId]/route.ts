import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET - Retrieve message history for a room
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[Chat API] No valid session found');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    
    console.log(`[Chat API] Loading messages for room ${roomId} for user ${session.user.id}`);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    // Ensure room exists or create it
    let room = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      // Create room if it doesn't exist (for DJ fan rooms, etc.)
      room = await prisma.chatRoom.create({
        data: {
          id: roomId,
          name: roomId.includes('dj-') ? 'DJ Fan Chat' : 'Chat Room',
          type: roomId.includes('dj-') ? 'DJ_FAN' : 'PUBLIC',
          djId: roomId.includes('dj-') ? roomId.split('-')[1] : null,
        }
      });
    }

    // Get messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        ...(before && { createdAt: { lt: new Date(before) } })
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform messages to match frontend format
    const transformedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      message: msg.message,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name || 'Unknown User',
        role: msg.sender.role,
        image: msg.sender.image,
      },
      timestamp: msg.createdAt.toISOString(),
      format: msg.format as any,
      reactions: msg.reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.userId);
        return acc;
      }, {} as Record<string, string[]>),
      type: msg.messageType === 'SYSTEM' ? 'system' : 'message',
    }));

    return NextResponse.json({
      messages: transformedMessages,
      roomId,
      hasMore: messages.length === limit,
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Store a new message
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
    const { message, format, type = 'TEXT' } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Ensure room exists
    let room = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          id: roomId,
          name: roomId.includes('dj-') ? 'DJ Fan Chat' : 'Chat Room',
          type: roomId.includes('dj-') ? 'DJ_FAN' : 'PUBLIC',
          djId: roomId.includes('dj-') ? roomId.split('-')[1] : null,
        }
      });
    }

    // Create the message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: session.user.id,
        message: message.trim(),
        messageType: type,
        format: format || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          }
        },
        reactions: true,
      }
    });

    // Transform message to match frontend format
    const transformedMessage = {
      id: chatMessage.id,
      message: chatMessage.message,
      sender: {
        id: chatMessage.sender.id,
        name: chatMessage.sender.name || 'Unknown User',
        role: chatMessage.sender.role,
        image: chatMessage.sender.image,
      },
      timestamp: chatMessage.createdAt.toISOString(),
      format: chatMessage.format as any,
      reactions: {},
      type: chatMessage.messageType === 'SYSTEM' ? 'system' : 'message',
    };

    return NextResponse.json({
      message: transformedMessage,
      success: true,
    });

  } catch (error) {
    console.error('Error storing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to store message' },
      { status: 500 }
    );
  }
} 
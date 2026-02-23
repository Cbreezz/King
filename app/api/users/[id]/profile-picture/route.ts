import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const { id: paramId } = await params;

  // Check if user is authenticated and can only update their own profile
  if (!userId || userId !== paramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
  }

  try {
    // Upload file to Vercel Blob
    const blob = await put(`profile-${userId}-${Date.now()}.${file.name.split('.').pop()}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Update user profile picture in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: blob.url },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      imageUrl: blob.url,
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth-options';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const { id: paramId } = await params;

  // Check if user is authenticated and can only delete their own profile
  if (!userId || userId !== paramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First, verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get the user's DJ and Club records to handle relationships
    const djRecord = await prisma.dj.findUnique({
      where: { userId }
    });

    const clubRecord = await prisma.club.findUnique({
      where: { userId }
    });

    // Start a simplified transaction with better error handling
    await prisma.$transaction(async (tx) => {
      // 1. Delete all direct user relationships first
      await Promise.all([
        // Message reactions
        tx.messageReaction.deleteMany({ where: { userId } }),
        // Chat messages
        tx.chatMessage.deleteMany({ where: { senderId: userId } }),
        // Comments
        tx.comment.deleteMany({ where: { userId } }),
        // User's moment likes
        tx.momentLike.deleteMany({ where: { userId } }),
        // DJ ratings given by user
        tx.djRating.deleteMany({ where: { userId } }),
        // Follow relationships (as follower)
        tx.follow.deleteMany({ where: { followerId: userId } }),
        // Follow relationships (as followed)
        tx.follow.deleteMany({ where: { followingId: userId } }),
        // Fan following (as follower)
        tx.fanFollowing.deleteMany({ where: { userId } })
      ]);

      // 2. Delete likes on user's moments
      await tx.momentLike.deleteMany({
        where: { moment: { userId } }
      });

      // 3. Delete user's moments
      await tx.moment.deleteMany({
        where: { userId }
      });

      // 4. Handle DJ-specific deletions
      if (djRecord) {
        await Promise.all([
          // DJ ratings received
          tx.djRating.deleteMany({ where: { dj: { userId } } }),
          // Fan following (as followed DJ)
          tx.fanFollowing.deleteMany({ where: { dj: { userId } } }),
          // DJ club affiliations
          tx.djClubAffiliation.deleteMany({ where: { djId: djRecord.id } }),
          // DJ performance history
          tx.djPerformanceHistory.deleteMany({ where: { djId: djRecord.id } }),
          // DJ schedules
          tx.djSchedule.deleteMany({ where: { djId: djRecord.id } }),
          // DJ events
          tx.event.deleteMany({ where: { djId: djRecord.id } })
        ]);

        // Delete DJ record
        await tx.dj.delete({ where: { id: djRecord.id } });
      }

      // 5. Handle Club-specific deletions
      if (clubRecord) {
        await Promise.all([
          // Events at this club
          tx.event.deleteMany({ where: { clubId: clubRecord.id } }),
          // DJ schedules at this club
          tx.djSchedule.deleteMany({ where: { clubId: clubRecord.id } }),
          // DJ performance history at this club
          tx.djPerformanceHistory.deleteMany({ where: { clubId: clubRecord.id } }),
          // DJ club affiliations
          tx.djClubAffiliation.deleteMany({ where: { clubId: clubRecord.id } })
        ]);

        // Delete club record
        await tx.club.delete({ where: { id: clubRecord.id } });
      }

      // 6. Delete authentication data
      await Promise.all([
        tx.session.deleteMany({ where: { userId } }),
        tx.account.deleteMany({ where: { userId } })
      ]);

      // 7. Finally, delete the user record
      await tx.user.delete({ where: { id: userId } });
    }, {
      timeout: 30000, // 30 second timeout
      maxWait: 5000,  // 5 second max wait
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Profile deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting profile:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Transaction')) {
        return NextResponse.json({ 
          error: 'Transaction failed - please try again' 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: `Failed to delete profile: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to delete profile' 
    }, { status: 500 });
  }
} 
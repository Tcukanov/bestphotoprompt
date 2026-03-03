import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    const prompt = await prisma.promptPost.findUnique({
      where: { id },
      include: {
        votes: session?.user?.id
          ? {
              where: { userId: session.user.id },
            }
          : false,
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (prompt.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Prompt not available' }, { status: 404 });
    }

    // Calculate site score
    const voteSum = await prisma.vote.aggregate({
      where: { promptPostId: id },
      _sum: { value: true },
    });

    const promptWithScore = {
      ...prompt,
      siteScore: voteSum._sum.value || 0,
      userVote: Array.isArray(prompt.votes) && prompt.votes.length > 0 ? prompt.votes[0] : null,
    };

    return NextResponse.json(promptWithScore);
  } catch (err) {
    console.error('Error fetching prompt:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch prompt',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

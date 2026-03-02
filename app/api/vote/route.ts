import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VoteRequest, VoteResponse } from '@/lib/types';
import { checkRateLimit, getClientIp } from '@/lib/utils';
import { z } from 'zod';

const voteSchema = z.object({
  promptPostId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitKey = `vote:${session.user.id}:${clientIp}`;
    if (!checkRateLimit(rateLimitKey, 50, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { promptPostId, value } = validation.data;

    // Check if prompt exists
    const prompt = await prisma.promptPost.findUnique({
      where: { id: promptPostId },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Upsert vote (create or update)
    await prisma.vote.upsert({
      where: {
        userId_promptPostId: {
          userId: session.user.id,
          promptPostId,
        },
      },
      create: {
        userId: session.user.id,
        promptPostId,
        value,
      },
      update: {
        value,
      },
    });

    // Calculate new site score
    const voteSum = await prisma.vote.aggregate({
      where: { promptPostId },
      _sum: { value: true },
    });

    const siteScore = voteSum._sum.value || 0;

    const response: VoteResponse = {
      success: true,
      siteScore,
      userVote: value,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error processing vote:', err);
    return NextResponse.json(
      {
        error: 'Failed to process vote',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove vote
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const promptPostId = searchParams.get('promptPostId');

    if (!promptPostId) {
      return NextResponse.json({ error: 'Missing promptPostId' }, { status: 400 });
    }

    // Delete vote
    await prisma.vote.deleteMany({
      where: {
        userId: session.user.id,
        promptPostId,
      },
    });

    // Calculate new site score
    const voteSum = await prisma.vote.aggregate({
      where: { promptPostId },
      _sum: { value: true },
    });

    const siteScore = voteSum._sum.value || 0;

    return NextResponse.json({
      success: true,
      siteScore,
      userVote: 0,
    });
  } catch (err) {
    console.error('Error deleting vote:', err);
    return NextResponse.json(
      {
        error: 'Failed to delete vote',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

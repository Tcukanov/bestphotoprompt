import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PromptListResponse } from '@/lib/types';
import { AIModel, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24')));
    const sort = searchParams.get('sort') || 'new';
    const modelFilter = searchParams.get('model') as AIModel | null;
    const tagFilter = searchParams.get('tag');
    const searchQuery = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: Prisma.PromptPostWhereInput = {
      status: 'PUBLISHED',
    };

    if (modelFilter && Object.values(AIModel).includes(modelFilter)) {
      where.model = modelFilter;
    }

    if (tagFilter) {
      where.tags = { has: tagFilter };
    }

    if (searchQuery) {
      where.OR = [
        { promptText: { contains: searchQuery, mode: 'insensitive' } },
        { rawText: { contains: searchQuery, mode: 'insensitive' } },
        { authorHandle: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { has: searchQuery.toLowerCase() } },
      ];
    }

    let orderBy: Prisma.PromptPostOrderByWithRelationInput[] = [];

    switch (sort) {
      case 'trending': {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        where.createdAtX = { gte: yesterday };
        orderBy = [{ viralScore: 'desc' }, { createdAtX: 'desc' }];
        break;
      }
      case 'top-week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        where.createdAtX = { gte: weekAgo };
        orderBy = [{ viralScore: 'desc' }];
        break;
      }
      case 'top-all':
        orderBy = [{ viralScore: 'desc' }];
        break;
      case 'new':
      default:
        orderBy = [{ createdAtX: 'desc' }];
        break;
    }

    const [prompts, total] = await Promise.all([
      prisma.promptPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          votes: session?.user?.id
            ? { where: { userId: session.user.id } }
            : false,
        },
      }),
      prisma.promptPost.count({ where }),
    ]);

    // Batch: get site scores for all prompts at once
    const promptIds = prompts.map((p) => p.id);
    const voteAggregates = await prisma.vote.groupBy({
      by: ['promptPostId'],
      where: { promptPostId: { in: promptIds } },
      _sum: { value: true },
    });

    const scoreMap = new Map(
      voteAggregates.map((v) => [v.promptPostId, v._sum.value || 0])
    );

    const promptsWithScores = prompts.map((prompt) => ({
      ...prompt,
      siteScore: scoreMap.get(prompt.id) || 0,
      userVote: Array.isArray(prompt.votes) && prompt.votes.length > 0 ? prompt.votes[0] : null,
    }));

    const response: PromptListResponse = {
      prompts: promptsWithScores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error fetching prompts:', err);
    return NextResponse.json(
      { error: 'Failed to fetch prompts', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

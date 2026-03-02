import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const promptCount = await prisma.promptPost.count();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      promptCount,
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

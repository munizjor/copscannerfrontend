import { NextResponse } from 'next/server'
import { getDistinctFeeds } from '@/lib/db'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const feeds = await getDistinctFeeds();
    return NextResponse.json(feeds);
  } catch (error) {
    console.error('API /api/feeds error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

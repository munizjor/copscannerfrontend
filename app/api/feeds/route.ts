import { NextResponse } from 'next/server'
import { getDistinctFeeds } from '@/lib/db'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const feeds = await getDistinctFeeds();
  return NextResponse.json(feeds);
}

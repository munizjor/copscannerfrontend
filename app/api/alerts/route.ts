import { NextResponse } from 'next/server'
import { getRecentAlerts } from '@/lib/db'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '15', 10)
    const offset = (page - 1) * limit
    const classifier = searchParams.get('classifier') || ''
    const keyword = searchParams.get('keyword') || ''
    const minScore = searchParams.get('minScore') || ''
    const maxScore = searchParams.get('maxScore') || ''
    const feed = searchParams.get('feed') || ''
    const data = await getRecentAlerts({ limit, offset, classifier, keyword, minScore, maxScore, feed })
    return NextResponse.json(data)
  } catch (error) {
    console.error('API /api/alerts error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

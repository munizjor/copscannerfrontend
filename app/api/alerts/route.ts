import { NextResponse } from 'next/server'
import { getRecentAlerts } from '@/lib/db'

export async function GET() {
  const data = await getRecentAlerts()
  return NextResponse.json(data)
}

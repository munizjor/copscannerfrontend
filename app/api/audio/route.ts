import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUrl } from '@/lib/s3'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key) {
    console.error('Missing key in request')
    return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  }
  try {
    const url = await getPresignedUrl(key)
    console.log('S3 Key:', key)
    console.log('Presigned URL:', url)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Error generating presigned URL:', err)
    return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 })
  }
}

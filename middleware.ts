import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  console.log('Detected host header:', host);
  if (host === 'copscannerfrontend.onrender.com') {
    return NextResponse.redirect('https://copscanneralert.westnode.com', 308);
  }
  return NextResponse.next();
}

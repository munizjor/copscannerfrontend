import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.hostname === 'copscannerfrontend.onrender.com') {
    return NextResponse.redirect('https://copscanneralert.westnode.com', 308);
  }
  return NextResponse.next();
}

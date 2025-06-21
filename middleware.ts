import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {  
  const host = request.headers.get('host')
  if (host === 'copscannerfrontend.onrender.com') {
    console.log('REDIRECTING!')
    return NextResponse.redirect('https://copscanneralert.westnode.com')
  }
  
  return NextResponse.next()
}

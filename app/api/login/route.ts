// app/api/login/route.ts
import { NextResponse } from 'next/server';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // In a real app, set a secure cookie or JWT here
    return NextResponse.json({ success: true, user: { username: ADMIN_USER } });
  }
  return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
}

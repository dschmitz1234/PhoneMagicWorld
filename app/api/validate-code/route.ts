import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === 'string' ? body.code.toUpperCase().trim() : null;

  if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data } = await db
    .from('families')
    .select('id, magic_code')
    .eq('magic_code', code)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  // Set a session cookie with the family code (httpOnly, sameSite strict)
  const response = NextResponse.json({ success: true });
  response.cookies.set('magic_code', code, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  return response;
}

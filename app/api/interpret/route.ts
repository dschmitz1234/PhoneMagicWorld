import { NextRequest, NextResponse } from 'next/server';
import { interpretTranscript } from '@/lib/claude';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { transcript, language } = body as { transcript?: string; language?: string };

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
  }

  const lang = language === 'de' ? 'de' : 'en';

  try {
    const interpretation = await interpretTranscript(transcript, lang);
    return NextResponse.json({ interpretation });
  } catch (err) {
    console.error('[/api/interpret] Error:', err);
    return NextResponse.json({ error: 'Interpretation failed' }, { status: 500 });
  }
}

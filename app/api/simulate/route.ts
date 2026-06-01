/**
 * /api/simulate — Twilio-free testing endpoint
 * Accepts a text input, runs the full interpret → storeRoomEvent pipeline.
 * Auth: requires X-Simulate-Secret header matching SIMULATE_SECRET env var,
 *       or SUPABASE_SERVICE_ROLE_KEY header (for internal use).
 *
 * POST body: { text: string, language?: 'en'|'de', familyId?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { interpretTranscript } from '@/lib/claude';
import { storeRoomEvent } from '@/lib/roomUtils';
import { getServiceClient } from '@/lib/supabase';

const SIMULATE_SECRET = process.env.SIMULATE_SECRET ?? '';

export async function POST(req: NextRequest) {
  // Auth: check header
  const authHeader =
    req.headers.get('x-simulate-secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    '';

  if (!SIMULATE_SECRET) {
    // No secret configured — only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'SIMULATE_SECRET not configured' }, { status: 503 });
    }
  } else if (authHeader !== SIMULATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, language, familyId } = body as {
    text?: string;
    language?: string;
    familyId?: string;
  };

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const lang = language === 'de' ? 'de' : 'en';
  const db = getServiceClient();

  try {
    // 1. Interpret the text
    const interpretation = await interpretTranscript(text, lang);

    // 2. Create a synthetic voice_message row (no real Twilio data)
    const { data: voiceMessage, error: vmError } = await db
      .from('voice_messages')
      .insert({
        twilio_call_sid: `sim_${Date.now()}`,
        twilio_recording_url: null,
        recording_duration: 0,
        transcript: text,
        raw_twilio_data: { simulated: true, language: lang, familyId: familyId ?? null },
        processed: true,
        family_id: familyId ?? null,
      })
      .select()
      .single();

    if (vmError || !voiceMessage) {
      throw new Error(`Failed to store voice message: ${vmError?.message}`);
    }

    // 3. Fan-out to room_events / creatures / letters / reminders / hidden_objects
    await storeRoomEvent({
      voiceMessageId: voiceMessage.id,
      interpretation,
      familyId: familyId ?? null,
    });

    return NextResponse.json({
      ok: true,
      interpretation,
      voiceMessageId: voiceMessage.id,
    });
  } catch (err) {
    console.error('[/api/simulate] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Simulation failed' },
      { status: 500 }
    );
  }
}

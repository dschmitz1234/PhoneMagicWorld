/**
 * /api/twilio/memo-ready — async background route triggered by /api/twilio/after-record.
 *
 * This route:
 *   1. Validates the internal shared secret (MEMO_READY_SECRET) — NOT a Twilio webhook
 *   2. Downloads the Twilio recording audio
 *   3. Uploads to Supabase Storage (voice-memos bucket)
 *   4. Transcribes with Azure Whisper (async, best-effort)
 *   5. Inserts into voice_memos table → triggers Realtime → shows in room UI
 *
 * Called internally from after-record via fetch() — not exposed to Twilio directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { downloadTwilioRecording, uploadMemoToStorage } from '@/lib/twilio';
import { transcribeAudio } from '@/lib/whisper';
import { getServiceClient } from '@/lib/supabase';

interface MemoPayload {
  callSid: string;
  recordingUrl: string;
  recordingDuration: number;
  senderFamilyId: string | null;
  recipientFamilyId: string;
  roomSlug: string;
}

export async function POST(req: NextRequest) {
  let payload: MemoPayload;
  try {
    payload = await req.json() as MemoPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const {
    callSid,
    recordingUrl,
    recordingDuration,
    senderFamilyId,
    recipientFamilyId,
    roomSlug,
  } = payload;

  if (!recordingUrl || !recipientFamilyId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getServiceClient();

  let audioBuffer: Buffer;
  try {
    audioBuffer = await downloadTwilioRecording(recordingUrl);
  } catch (err) {
    console.error('[memo-ready] Failed to download recording:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }

  let audioUrl: string;
  const uploadFamilyId = senderFamilyId ?? recipientFamilyId;
  try {
    audioUrl = await uploadMemoToStorage(audioBuffer, uploadFamilyId);
  } catch (err) {
    console.error('[memo-ready] Failed to upload to storage:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  // Transcribe best-effort (do not fail if Whisper is unavailable)
  let transcript: string | null = null;
  const whisperLang = (process.env.WHISPER_LANGUAGE_UK ?? 'en') as 'en' | 'de';
  try {
    transcript = await transcribeAudio(audioBuffer, whisperLang);
  } catch (err) {
    console.warn('[memo-ready] Whisper transcription failed (non-fatal):', err);
  }

  // Deterministic position seeded from callSid to spread orbs around the room
  const hash = callSid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const positionX = 20 + (hash % 60); // 20–80%
  const positionY = 55 + ((hash * 7) % 25); // 55–80%

  const { error } = await db.from('voice_memos').insert({
    sender_family_id: senderFamilyId,
    recipient_family_id: recipientFamilyId,
    room_slug: roomSlug,
    audio_url: audioUrl,
    duration_seconds: recordingDuration || null,
    transcript,
    is_listened: false,
    position_x: positionX,
    position_y: positionY,
    call_sid: callSid,
  });

  if (error) {
    console.error('[memo-ready] DB insert failed:', error);
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
  }

  console.log(`[memo-ready] Voice memo created for family ${recipientFamilyId} in ${roomSlug}`);
  return NextResponse.json({ success: true });
}

/**
 * /api/twilio/after-record — called by Twilio RecordingStatusCallback
 * after a voice memo recording completes.
 *
 * This route:
 *   1. Validates the Twilio signature
 *   2. Loads the conversation's pending_action to find target room/person
 *   3. Fires off async processing to /api/twilio/memo-ready (non-blocking)
 *   4. Returns 204 (no TwiML — the TwiML continuation was already in /respond)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioSignature } from '@/lib/twilio';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = `${process.env.BASE_URL}/api/twilio/after-record`;

  const body = await req.formData();
  const params: Record<string, string> = {};
  body.forEach((v, k) => { params[k] = v as string; });

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const callSid = params['CallSid'] ?? '';
  const recordingUrl = params['RecordingUrl'] ?? '';
  const recordingDuration = parseInt(params['RecordingDuration'] ?? '0', 10);
  const recordingStatus = params['RecordingStatus'] ?? '';

  if (recordingStatus !== 'completed' || !recordingUrl) {
    console.log('[after-record] Skipping — status:', recordingStatus, 'url:', recordingUrl);
    return new NextResponse(null, { status: 204 });
  }

  const db = getServiceClient();

  // Load conversation to get family_id and pending_action
  const { data: convo } = await db
    .from('conversations')
    .select('family_id, pending_action')
    .eq('call_sid', callSid)
    .maybeSingle();

  const familyId: string | null = convo?.family_id ?? null;
  const pendingAction = convo?.pending_action as Record<string, unknown> | null;

  // Determine target from pending_action
  const targetRoom = (pendingAction?.target_room as string) ?? 'forest';
  const targetDisplayName = (pendingAction?.target_display_name as string | null) ?? null;

  // Resolve recipient family_id: if targeting a person by display_name, look them up
  let recipientFamilyId: string | null = familyId; // default: send to own family
  if (targetDisplayName) {
    const { data: targetFamily } = await db
      .from('families')
      .select('id')
      .ilike('display_name', targetDisplayName)
      .maybeSingle();
    if (targetFamily?.id) recipientFamilyId = targetFamily.id;
  }

  if (!recipientFamilyId) {
    console.error('[after-record] No recipient family found — skipping memo creation');
    return new NextResponse(null, { status: 204 });
  }

  // Kick off async memo processing — fire and forget within Vercel's 5s window
  // We pass all context in the body; memo-ready does download + Whisper + DB insert
  const memoPayload = {
    callSid,
    recordingUrl,
    recordingDuration,
    senderFamilyId: familyId,
    recipientFamilyId,
    roomSlug: targetRoom,
  };

  // Non-blocking fetch — we don't await the result
  fetch(`${process.env.BASE_URL}/api/twilio/memo-ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memoPayload),
  }).catch((err) => {
    console.error('[after-record] Failed to trigger memo-ready:', err);
  });

  return new NextResponse(null, { status: 204 });
}

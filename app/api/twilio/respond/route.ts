/**
 * /api/twilio/respond — handles each Gather speech result in conversation mode.
 *
 * Flow per turn:
 *   1. Validate Twilio signature
 *   2. Load conversation state from DB
 *   3. Check SpeechResult confidence; handle silence/low-confidence
 *   4. Call chatConversation() to get AI response
 *   5. Append turn to history (trimmed to last 6)
 *   6. If action_payload is record_voice_memo → branch to <Record> via after-record route
 *   7. If conversation_complete → hangup
 *   8. Otherwise → loop back with another <Gather>
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { validateTwilioSignature } from '@/lib/twilio';
import { chatConversation } from '@/lib/claude';
import { getServiceClient } from '@/lib/supabase';
import { ConversationTurn } from '@/types';

const MAX_SILENCE = 3;
const MAX_HISTORY_TURNS = 6;
const MIN_CONFIDENCE = 0.4;

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = `${process.env.BASE_URL}/api/twilio/respond`;

  const body = await req.formData();
  const params: Record<string, string> = {};
  body.forEach((v, k) => { params[k] = v as string; });

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const callSid = params['CallSid'] ?? '';
  const speechResult = params['SpeechResult'] ?? '';
  const confidence = parseFloat(params['Confidence'] ?? '1');
  const calledNumber = params['To'] ?? '';
  const isGerman = calledNumber.startsWith('+49');
  const voice = isGerman ? 'Polly.Vicki' : 'Polly.Amy';
  const gatherLang = isGerman ? 'de-DE' : 'en-GB';

  const db = getServiceClient();

  // Load conversation record
  const { data: convo } = await db
    .from('conversations')
    .select('*')
    .eq('call_sid', callSid)
    .maybeSingle();

  const history: ConversationTurn[] = (convo?.history ?? []) as ConversationTurn[];
  const familyId: string | null = convo?.family_id ?? null;
  const language = (convo?.language ?? (isGerman ? 'de' : 'en')) as 'en' | 'de';
  let silenceCount: number = convo?.silence_count ?? 0;

  const twiml = new twilio.twiml.VoiceResponse();

  // ── Handle silence (no speech recognised) ──────────────────────────────────
  if (!speechResult) {
    silenceCount += 1;
    await db.from('conversations').update({
      silence_count: silenceCount,
      updated_at: new Date().toISOString(),
    }).eq('call_sid', callSid);

    if (silenceCount >= MAX_SILENCE) {
      const bye = isGerman
        ? 'Ich konnte dich nicht hören. Auf Wiedersehen!'
        : "I couldn't hear you. Goodbye for now!";
      twiml.say({ voice }, bye);
      twiml.hangup();
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    const tryAgain = isGerman
      ? 'Hmm, ich habe dich nicht verstanden. Kannst du das wiederholen?'
      : "Hmm, I didn't quite hear that. Could you try again?";
    const gather = twiml.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true,
      language: gatherLang,
      action: `${process.env.BASE_URL}/api/twilio/respond`,
      method: 'POST',
      profanityFilter: true,
    } as Parameters<typeof twiml.gather>[0]);
    gather.say({ voice }, tryAgain);
    twiml.hangup();
    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }

  // ── Handle low confidence ──────────────────────────────────────────────────
  if (confidence < MIN_CONFIDENCE) {
    const repeat = isGerman
      ? 'Entschuldigung, das war ein bisschen unklar. Könntest du das noch einmal sagen?'
      : "Sorry, that was a little unclear. Could you say that again?";
    const gather = twiml.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true,
      language: gatherLang,
      action: `${process.env.BASE_URL}/api/twilio/respond`,
      method: 'POST',
      profanityFilter: true,
    } as Parameters<typeof twiml.gather>[0]);
    gather.say({ voice }, repeat);
    twiml.hangup();
    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }

  // ── Call AI ────────────────────────────────────────────────────────────────
  let aiResponse;
  try {
    aiResponse = await chatConversation(history, speechResult, language, familyId);
  } catch (err) {
    console.error('[twilio/respond] chatConversation error:', err);
    const errMsg = isGerman
      ? 'Die Magie ist gerade ein wenig müde. Versuche es später noch einmal.'
      : 'The magic is a little tired right now. Please try again later.';
    twiml.say({ voice }, errMsg);
    twiml.hangup();
    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }

  // Append turn to history and trim to last MAX_HISTORY_TURNS
  const newHistory: ConversationTurn[] = [
    ...history,
    { role: 'user' as const, text: speechResult },
    { role: 'assistant' as const, text: aiResponse.spoken_reply },
  ].slice(-MAX_HISTORY_TURNS);

  // ── Handle voice memo recording intent ────────────────────────────────────
  if (
    aiResponse.intent === 'record_voice_memo' &&
    aiResponse.action_payload?.prompt_to_speak
  ) {
    const promptToSpeak = String(aiResponse.action_payload.prompt_to_speak);

    // Persist history + pending action before branching to <Record>
    await db.from('conversations').update({
      history: newHistory,
      silence_count: 0,
      pending_action: aiResponse.action_payload,
      is_complete: false,
      updated_at: new Date().toISOString(),
    }).eq('call_sid', callSid);

    twiml.say({ voice }, promptToSpeak);
    twiml.record({
      maxLength: 90,
      transcribe: false,
      recordingStatusCallback: `${process.env.BASE_URL}/api/twilio/after-record`,
      recordingStatusCallbackMethod: 'POST',
      playBeep: true,
      trim: 'trim-silence',
    });
    // After recording, ask if they want to do anything else
    const gather = twiml.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      enhanced: true,
      language: gatherLang,
      action: `${process.env.BASE_URL}/api/twilio/respond`,
      method: 'POST',
      profanityFilter: true,
    } as Parameters<typeof twiml.gather>[0]);
    const afterRecordMsg = isGerman
      ? 'Wunderbar! Deine Nachricht wurde gespeichert. Was möchtest du noch tun?'
      : 'Wonderful! Your message has been saved. Is there anything else you\'d like to do?';
    gather.say({ voice }, afterRecordMsg);
    twiml.hangup();
    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }

  // ── Persist updated history ───────────────────────────────────────────────
  await db.from('conversations').update({
    history: newHistory,
    silence_count: 0,
    is_complete: aiResponse.conversation_complete,
    updated_at: new Date().toISOString(),
  }).eq('call_sid', callSid);

  // ── Conversation complete → hangup ────────────────────────────────────────
  if (aiResponse.conversation_complete) {
    twiml.say({ voice }, aiResponse.spoken_reply);
    twiml.hangup();
    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }

  // ── Continue conversation loop ────────────────────────────────────────────
  const gather = twiml.gather({
    input: ['speech'],
    speechTimeout: 'auto',
    speechModel: 'phone_call',
    enhanced: true,
    language: gatherLang,
    action: `${process.env.BASE_URL}/api/twilio/respond`,
    method: 'POST',
    profanityFilter: true,
  } as Parameters<typeof twiml.gather>[0]);
  gather.say({ voice }, aiResponse.spoken_reply);

  // No speech detected after gather → hangup gracefully
  const fallbackBye = isGerman ? 'Auf Wiedersehen!' : 'Goodbye for now!';
  twiml.say({ voice }, fallbackBye);
  twiml.hangup();

  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
}

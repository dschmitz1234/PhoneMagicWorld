import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { lookupFamilyByPhone, validateTwilioSignature } from '@/lib/twilio';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  // Validate Twilio request signature
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = `${process.env.BASE_URL}/api/twilio/incoming`;
  const body = await req.formData();
  const params: Record<string, string> = {};
  body.forEach((value, key) => {
    params[key] = value as string;
  });

  const valid = validateTwilioSignature(signature, url, params);
  console.log('[twilio/incoming] url:', url, '| sig:', signature.slice(0, 20) + '...', '| valid:', valid, '| BASE_URL env:', process.env.BASE_URL ?? '(unset)');

  if (!valid) {
    console.log('[twilio/incoming] 403 Forbidden — signature mismatch');
    return new NextResponse('Forbidden', { status: 403 });
  }

  const callerNumber = params['From'] ?? '';
  const calledNumber = params['To'] ?? '';
  const callSid = params['CallSid'] ?? '';
  const isGerman = calledNumber.startsWith('+49');
  const language = isGerman ? 'de' : 'en';
  const voice = isGerman ? 'Polly.Vicki' : 'Polly.Amy';

  const mode = process.env.TWILIO_MODE ?? 'recording';

  if (mode === 'conversation') {
    // ── Conversation mode: <Gather> speech loop ──────────────────────────────
    const family = await lookupFamilyByPhone(callerNumber);
    const callerName = family?.display_name ?? null;
    const greetingText = isGerman
      ? callerName
        ? `Hallo ${callerName}! Willkommen in deiner magischen Welt. Was möchtest du erschaffen?`
        : 'Willkommen in der magischen Welt. Was möchtest du erschaffen?'
      : callerName
      ? `Hello ${callerName}! Welcome to your Magical World. What would you like to create?`
      : "Welcome to the Magical World. What would you like to create or explore today?";

    // Upsert the conversation record (creates it with empty history)
    const db = getServiceClient();
    await db.from('conversations').upsert(
      {
        call_sid: callSid,
        family_id: family?.id ?? null,
        language,
        history: [],
        silence_count: 0,
        is_complete: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'call_sid' }
    );

    const gatherLang = isGerman ? 'de-DE' : 'en-GB';
    const twiml = new twilio.twiml.VoiceResponse();
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
    gather.say({ voice }, greetingText);

    // Fallback if no speech detected after timeout
    const noSpeechMsg = isGerman
      ? 'Ich konnte dich nicht hören. Tschüss!'
      : "I couldn't hear you. Goodbye for now!";
    twiml.say({ voice }, noSpeechMsg);
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // ── Legacy recording mode ─────────────────────────────────────────────────
  const greeting = isGerman
    ? 'Willkommen in der magischen Welt. Ich höre zu... erzähl mir etwas Wunderbares. Du hast eine Minute.'
    : "Welcome to the Magical World. I'm listening... tell me something wonderful. You have one minute.";
  const goodbye = isGerman
    ? 'Auf Wiedersehen. Die magische Welt wartet auf dich.'
    : 'Goodbye for now. The Magical World will be waiting for you.';

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ voice }, greeting);
  twiml.pause({ length: 1 });
  twiml.record({
    maxLength: 60,
    transcribe: false,
    recordingStatusCallback: `${process.env.BASE_URL}/api/twilio/recording`,
    recordingStatusCallbackMethod: 'POST',
    playBeep: true,
    trim: 'trim-silence',
  });
  twiml.say({ voice }, goodbye);

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

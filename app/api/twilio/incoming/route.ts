import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { lookupFamilyByPhone, validateTwilioSignature } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  // Validate Twilio request signature
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = `${process.env.BASE_URL}/api/twilio/incoming`;
  const body = await req.formData();
  const params: Record<string, string> = {};
  body.forEach((value, key) => {
    params[key] = value as string;
  });

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const callerNumber = params['From'] ?? '';
  const calledNumber = params['To'] ?? '';
  const isGerman = calledNumber.startsWith('+49');

  // Look up family by their registered number (optional — MVP allows null)
  await lookupFamilyByPhone(callerNumber);

  const voice = isGerman ? 'Polly.Vicki' : 'Polly.Amy';
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

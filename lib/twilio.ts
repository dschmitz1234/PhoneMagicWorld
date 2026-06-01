import twilio from 'twilio';
import { getServiceClient } from './supabase';

export async function lookupFamilyByPhone(phoneNumber: string) {
  const db = getServiceClient();
  const { data } = await db
    .from('families')
    .select('*')
    .or(`phone_uk.eq.${phoneNumber},phone_de.eq.${phoneNumber}`)
    .maybeSingle();
  return data;
}

export async function downloadTwilioRecording(recordingUrl: string): Promise<Buffer> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;

  // Use mp3 format
  const mp3Url = recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`;

  const response = await fetch(mp3Url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download recording: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  return twilio.validateRequest(authToken, signature, url, params);
}

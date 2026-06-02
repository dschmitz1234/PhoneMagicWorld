import twilio from 'twilio';
import { getServiceClient } from './supabase';
import { Family } from '@/types';

export async function lookupFamilyByPhone(phoneNumber: string): Promise<Family | null> {
  const db = getServiceClient();
  const { data } = await db
    .from('families')
    .select('*')
    .or(`phone_uk.eq.${phoneNumber},phone_de.eq.${phoneNumber}`)
    .maybeSingle();
  return data as Family | null;
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

export async function uploadMemoToStorage(
  audioBuffer: Buffer,
  familyId: string
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const bucket = process.env.SUPABASE_VOICE_MEMO_BUCKET ?? 'voice-memos';
  const path = `${familyId}/${crypto.randomUUID()}.mp3`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, audioBuffer, { contentType: 'audio/mpeg', upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

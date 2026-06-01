import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioSignature, downloadTwilioRecording } from '@/lib/twilio';
import { transcribeAudio, moderateContent } from '@/lib/whisper';
import { interpretTranscript } from '@/lib/claude';
import { getServiceClient } from '@/lib/supabase';
import { storeRoomEvent } from '@/lib/roomUtils';

export async function POST(req: NextRequest) {
  // Validate Twilio request signature
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = `${process.env.BASE_URL}/api/twilio/recording`;
  const body = await req.formData();
  const params: Record<string, string> = {};
  body.forEach((value, key) => {
    params[key] = value as string;
  });

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const recordingUrl = params['RecordingUrl'] ?? '';
  const callSid = params['CallSid'] ?? '';
  const duration = parseInt(params['RecordingDuration'] ?? '0', 10);
  const calledNumber = params['To'] ?? '';

  // Skip very short recordings (< 2 seconds)
  if (duration < 2) {
    return NextResponse.json({ skipped: true });
  }

  const db = getServiceClient();

  try {
    // 1. Store raw voice message record
    const { data: voiceMessage, error: vmError } = await db
      .from('voice_messages')
      .insert({
        twilio_call_sid: callSid,
        twilio_recording_url: recordingUrl,
        recording_duration: duration,
        raw_twilio_data: params,
        processed: false,
      })
      .select()
      .single();

    if (vmError || !voiceMessage) {
      throw new Error(`Failed to store voice message: ${vmError?.message}`);
    }

    // 2. Download audio from Twilio
    const audioBuffer = await downloadTwilioRecording(recordingUrl);

    // 3. Transcribe with Whisper
    const language = calledNumber.startsWith('+49') ? 'de' : 'en';
    const transcript = await transcribeAudio(audioBuffer, language);

    // 4. Content moderation — flag and skip if inappropriate
    const isFlagged = await moderateContent(transcript);
    if (isFlagged) {
      await db
        .from('voice_messages')
        .update({ transcript: '[moderated]', processed: true })
        .eq('id', voiceMessage.id);
      console.warn(`Moderated transcript for call ${callSid}`);
      return NextResponse.json({ moderated: true });
    }

    // 5. Update voice message with transcript
    await db
      .from('voice_messages')
      .update({ transcript, processed: true })
      .eq('id', voiceMessage.id);

    // 6. Interpret with Claude
    const interpretation = await interpretTranscript(transcript, language);

    // 7. Store room event, creature, letter, etc.
    await storeRoomEvent({
      voiceMessageId: voiceMessage.id,
      interpretation,
      // family_id is null until linked — fine for MVP
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Recording pipeline error:', err);
    return NextResponse.json({ error: 'Pipeline failed' }, { status: 500 });
  }
}

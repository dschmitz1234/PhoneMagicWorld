import OpenAI, { AzureOpenAI } from 'openai';

function createClient() {
  const endpoint = process.env.AZURE_WHISPER_ENDPOINT;
  const apiKey   = process.env.AZURE_WHISPER_API_KEY;
  const deployment = process.env.AZURE_WHISPER_DEPLOYMENT ?? 'whisper';
  const apiVersion = process.env.AZURE_WHISPER_API_VERSION ?? '2024-06-01';
  if (endpoint && apiKey) {
    return { client: new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment }), model: deployment };
  }
  return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), model: 'whisper-1' };
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  language: 'en' | 'de' = 'en'
): Promise<string> {
  const { client, model } = createClient();
  const arrayBuf = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength
  ) as ArrayBuffer;
  const file = new File([arrayBuf], 'recording.mp3', { type: 'audio/mpeg' });

  const response = await client.audio.transcriptions.create({
    file,
    model,
    language,
    prompt:
      language === 'en'
        ? 'A child describing animals, rooms, magical things, or leaving a message.'
        : 'Ein Kind beschreibt Tiere, Räume, magische Dinge oder hinterlässt eine Nachricht.',
  });

  return response.text;
}

export async function moderateContent(text: string): Promise<boolean> {
  // Azure OpenAI doesn't support the moderations endpoint — skip when using Azure Whisper
  if (process.env.AZURE_WHISPER_ENDPOINT) return false;
  const { client } = createClient();
  const response = await (client as OpenAI).moderations.create({ input: text });
  return response.results[0]?.flagged ?? false;
}

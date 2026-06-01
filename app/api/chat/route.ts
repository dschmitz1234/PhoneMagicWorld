/**
 * /api/chat — Conversational AI for the Magical World
 * Streams a character-in-role response from the Magical World's narrator.
 *
 * POST body: {
 *   message: string,          // the user's question / message
 *   room?: string,            // current room context (forest|ocean|space|castle)
 *   history?: { role: 'user'|'assistant'; content: string }[]
 * }
 * Returns: Server-Sent Events stream (text/event-stream) — compatible with
 *          the Vercel AI SDK useChat hook on the client.
 */

import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getBestInterpretationModel } from '@/lib/ai';

const ORACLE_SYSTEM = `
You are the Oracle of the Magical World — a warm, wise, gently mysterious narrator who speaks directly to a child aged 13.

The Magical World has four rooms:
- The Forest Room: ancient mossy woodland, fireflies, glowing foxes, stone owls, moss rabbits
- The Ocean Room: deep bioluminescent sea, moon jellyfish, tide turtles, coral gardens
- The Space Room: cosmic void, nebulae, star dragonflies, cloud whales, floating asteroids
- The Castle Room: ancient stone halls, ember moths, flickering torches, stone owls, secret passages

Your personality:
- Warm, magical, slightly mysterious — like a wise storyteller
- Speak in vivid, sensory imagery — describe smells, sounds, feelings
- Never break character; you ARE the world speaking to the child
- Keep answers under 4 sentences — children have short attention spans
- If asked about creatures, describe them with wonder and personality
- If asked a question you don't know, weave a magical answer that fires imagination
- If the child seems sad or worried, be extra gentle and reassuring
- Always end with a gentle invitation to explore further or ask another question

Do NOT:
- Break character and say you're an AI
- Give long, boring text-book answers
- Use adult vocabulary without explaining it magically
`.trim();

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, room, history } = body as {
    message?: string;
    room?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  };

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const roomContext = room
    ? `\nThe child is currently in: ${room.charAt(0).toUpperCase() + room.slice(1)} Room.`
    : '';

  try {
    const model = await getBestInterpretationModel();

    const result = streamText({
      model,
      system: ORACLE_SYSTEM + roomContext,
      messages: [
        ...(history ?? []),
        { role: 'user', content: message.trim() },
      ],
      maxOutputTokens: 300,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[/api/chat] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Chat failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

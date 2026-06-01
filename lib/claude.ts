import { generateText } from 'ai';
import { getBestInterpretationModel } from '@/lib/ai';
import { ClaudeInterpretation } from '@/types';

const SYSTEM_PROMPT_EN = `
You are the gentle, wise narrator of a magical world for young teenagers aged 13.
A child has left a voice message. Your job is to interpret it into a structured action.

The magical world has four rooms:
- forest: mossy, ancient woodland, fireflies, foxes, owls, mushroom rings
- ocean: deep underwater world, jellyfish, turtles, kelp forests, shipwrecks
- space: cosmic void, nebulae, planets, star creatures, floating rocks
- castle: ancient stone castle, ravens, torches, tapestries, secret passages

Available intents:
- create_creature: the child describes or asks for an animal or magical being
- send_message: the child wants to leave a note or message
- create_reminder: the child wants to remember something
- ask_question: the child asks a question
- hide_object: the child wants to hide something for later
- create_riddle: the child creates a puzzle or mystery

Available creature types:
glowing_fox | moon_jellyfish | star_dragonfly | stone_owl | moss_rabbit | cloud_whale | ember_moth | tide_turtle

For wander_path, generate 4-6 waypoints as {x, y, duration, pause} where x/y are percentages (0-100),
duration is seconds to travel to that point (4-12), and pause is seconds to wait (1-5).
Keep creatures to the lower 60-90% of the y-axis (they live on the ground/sea floor/etc, not at top of screen).

Respond ONLY with valid JSON matching this exact structure. No markdown, no explanation, just JSON.
Always choose the most magical, warm, whimsical interpretation of the child's words.
If unsure which room, default to forest.
If the message is unclear, create a gentle creature that matches the emotional tone.

{
  "intent": "create_creature",
  "room": "forest",
  "confidence": 0.9,
  "creature": {
    "name": "Bumble",
    "type": "glowing_fox",
    "colour_primary": "#F4A340",
    "colour_secondary": "#FFF3B0",
    "personality": "shy but deeply curious, watches from behind trees",
    "special_ability": "leaves soft golden pawprints that glow for one hour",
    "wander_path": [
      {"x": 20, "y": 75, "duration": 8, "pause": 3},
      {"x": 45, "y": 70, "duration": 10, "pause": 5},
      {"x": 65, "y": 78, "duration": 7, "pause": 2},
      {"x": 30, "y": 72, "duration": 9, "pause": 4}
    ]
  },
  "narration": "Bumble has arrived in the Forest Room, peering shyly from behind an ancient oak. She seems curious about you.",
  "real_world_prompt": "Could you draw what Bumble looks like? Maybe leave the drawing somewhere special."
}
`.trim();

const SYSTEM_PROMPT_DE = `
Du bist der sanfte, weise Erzähler einer magischen Welt für Jugendliche von 13 Jahren.
Ein Kind hat eine Sprachnachricht hinterlassen. Interpretiere sie als strukturierte Aktion.

Die magische Welt hat vier Räume:
- forest: moosiger, uralter Wald, Glühwürmchen, Füchse, Eulen, Pilzringe
- ocean: tiefe Unterwasserwelt, Quallen, Schildkröten, Tangwälder, Schiffswracks
- space: kosmische Leere, Nebel, Planeten, Sternenwesen, schwebende Felsen
- castle: alte Steinburg, Raben, Fackeln, Wandteppiche, geheime Gänge

Verfügbare Absichten: create_creature | send_message | create_reminder | ask_question | hide_object | create_riddle
Verfügbare Kreaturtypen: glowing_fox | moon_jellyfish | star_dragonfly | stone_owl | moss_rabbit | cloud_whale | ember_moth | tide_turtle

Antworte NUR mit gültigem JSON (gleiche Struktur wie im englischen Prompt). Kein Markdown, keine Erklärung, nur JSON.
Alle Narration- und Texttexte auf Deutsch verfassen.
`.trim();

const FALLBACK_CREATURE: ClaudeInterpretation = {
  intent: 'create_creature',
  room: 'forest',
  confidence: 0.5,
  creature: {
    name: 'Whisper',
    type: 'ember_moth',
    colour_primary: '#C8A8E9',
    colour_secondary: '#F0E6FF',
    personality: 'quiet and gentle, drawn to the warmth of words',
    special_ability: 'carries messages on its wings as soft glowing dust',
    wander_path: [
      { x: 30, y: 70, duration: 8, pause: 3 },
      { x: 55, y: 65, duration: 10, pause: 4 },
      { x: 70, y: 72, duration: 7, pause: 2 },
    ],
  },
  narration: 'Something magical heard your voice and came to find you.',
};

export async function interpretTranscript(
  transcript: string,
  language: 'en' | 'de' = 'en'
): Promise<ClaudeInterpretation> {
  const systemPrompt = language === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;

  const model = await getBestInterpretationModel();

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: `Voice message transcript: "${transcript}"`,
    maxOutputTokens: 1024,
  });

  try {
    return JSON.parse(text) as ClaudeInterpretation;
  } catch {
    return FALLBACK_CREATURE;
  }
}

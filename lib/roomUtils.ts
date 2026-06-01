import { getServiceClient } from './supabase';
import { ClaudeInterpretation } from '@/types';

interface StoreRoomEventParams {
  voiceMessageId: string;
  interpretation: ClaudeInterpretation;
  familyId?: string | null;
}

export async function storeRoomEvent({
  voiceMessageId,
  interpretation,
  familyId = null,
}: StoreRoomEventParams): Promise<void> {
  const db = getServiceClient();

  // Resolve room id from slug
  const { data: room } = await db
    .from('rooms')
    .select('id')
    .eq('slug', interpretation.room)
    .single();

  if (!room) {
    throw new Error(`Unknown room slug: ${interpretation.room}`);
  }

  // Store the room event
  const { data: roomEvent, error: eventError } = await db
    .from('room_events')
    .insert({
      family_id: familyId,
      room_id: room.id,
      voice_message_id: voiceMessageId,
      intent: interpretation.intent,
      payload: interpretation,
      is_active: true,
    })
    .select()
    .single();

  if (eventError || !roomEvent) {
    throw new Error(`Failed to store room event: ${eventError?.message}`);
  }

  const base = {
    family_id: familyId,
    room_id: room.id,
    room_event_id: roomEvent.id,
  };

  switch (interpretation.intent) {
    case 'create_creature': {
      const c = interpretation.creature;
      if (!c) break;
      await db.from('creatures').insert({
        ...base,
        name: c.name,
        creature_type: c.type,
        colour_primary: c.colour_primary,
        colour_secondary: c.colour_secondary,
        personality: c.personality,
        special_ability: c.special_ability,
        origin_message: '',
        position_x: c.wander_path[0]?.x ?? 50,
        position_y: c.wander_path[0]?.y ?? 70,
        wander_path: c.wander_path,
        is_active: true,
      });
      break;
    }

    case 'send_message': {
      const l = interpretation.letter;
      if (!l) break;
      await db.from('magic_letters').insert({
        ...base,
        sender_name: l.sender_name,
        content_text: l.content_text,
        envelope_colour: l.envelope_colour ?? 'gold',
        animation_type: l.animation_type ?? 'float',
        position_x: l.position_x ?? 50,
        position_y: l.position_y ?? 50,
        is_opened: false,
      });
      break;
    }

    case 'create_reminder': {
      const r = interpretation.reminder;
      if (!r) break;
      await db.from('reminders').insert({
        ...base,
        message_text: r.message_text,
        orb_colour: r.orb_colour ?? 'lavender',
        remind_at: r.remind_at,
        is_completed: false,
      });
      break;
    }

    case 'hide_object':
    case 'create_riddle': {
      const h = interpretation.hidden_object;
      if (!h) break;
      await db.from('hidden_objects').insert({
        ...base,
        object_type: h.object_type,
        description: h.description,
        hint_text: h.hint_text,
        position_x: h.position_x ?? 50,
        position_y: h.position_y ?? 70,
        is_found: false,
      });
      break;
    }

    // ask_question: just the room_event record is enough
    default:
      break;
  }
}

export function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

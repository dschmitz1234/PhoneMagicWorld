export type RoomSlug = 'forest' | 'ocean' | 'space' | 'castle';

export type IntentType =
  | 'create_creature'
  | 'send_message'
  | 'create_reminder'
  | 'ask_question'
  | 'hide_object'
  | 'create_riddle';

export type CreatureType =
  | 'glowing_fox'
  | 'moon_jellyfish'
  | 'star_dragonfly'
  | 'stone_owl'
  | 'moss_rabbit'
  | 'cloud_whale'
  | 'ember_moth'
  | 'tide_turtle';

export interface WanderWaypoint {
  x: number;       // percentage 0-100
  y: number;       // percentage 0-100
  duration: number; // seconds to reach this point
  pause: number;    // seconds to pause here
}

export interface Creature {
  id: string;
  family_id: string | null;
  room_id: string;
  name: string;
  creature_type: CreatureType;
  colour_primary: string;
  colour_secondary: string;
  personality: string;
  special_ability: string;
  origin_message: string;
  position_x: number;
  position_y: number;
  wander_path: WanderWaypoint[];
  is_active: boolean;
  created_at: string;
}

export interface MagicLetter {
  id: string;
  family_id: string | null;
  room_id: string;
  sender_name: string;
  content_text: string;
  envelope_colour: string;
  animation_type: 'float' | 'spin' | 'pulse' | 'orbit';
  position_x: number;
  position_y: number;
  is_opened: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  family_id: string | null;
  room_id: string;
  message_text: string;
  orb_colour: string;
  remind_at: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface HiddenObject {
  id: string;
  family_id: string | null;
  room_id: string;
  object_type: string;
  description: string;
  hint_text: string;
  position_x: number;
  position_y: number;
  is_found: boolean;
  created_at: string;
}

export interface RoomEvent {
  id: string;
  family_id: string | null;
  room_id: string;
  voice_message_id: string;
  intent: IntentType;
  payload: ClaudeInterpretation;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  slug: RoomSlug;
  display_name: string;
  theme_config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface Family {
  id: string;
  magic_code: string;
  family_name: string | null;
  phone_uk: string | null;
  phone_de: string | null;
  created_at: string;
}

export interface ClaudeInterpretation {
  intent: IntentType;
  room: RoomSlug;
  confidence: number;
  creature?: {
    name: string;
    type: CreatureType;
    colour_primary: string;
    colour_secondary: string;
    personality: string;
    special_ability: string;
    wander_path: WanderWaypoint[];
  };
  letter?: {
    sender_name: string;
    content_text: string;
    envelope_colour: string;
    animation_type: string;
    position_x: number;
    position_y: number;
  };
  reminder?: {
    message_text: string;
    orb_colour: string;
    remind_at: string | null;
  };
  hidden_object?: {
    object_type: string;
    description: string;
    hint_text: string;
    position_x: number;
    position_y: number;
  };
  narration: string;
  real_world_prompt?: string;
}

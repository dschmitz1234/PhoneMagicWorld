import { getServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import ForestRoom from '@/components/rooms/ForestRoom';
import OceanRoom from '@/components/rooms/OceanRoom';
import SpaceRoom from '@/components/rooms/SpaceRoom';
import CastleRoom from '@/components/rooms/CastleRoom';
import { Creature, MagicLetter, RoomSlug, VoiceMemo } from '@/types';

interface RoomPageProps {
  params: Promise<{ room: string }>;
}

const VALID_ROOMS: RoomSlug[] = ['forest', 'ocean', 'space', 'castle'];

export default async function RoomPage({ params }: RoomPageProps) {
  const { room } = await params;

  if (!VALID_ROOMS.includes(room as RoomSlug)) {
    redirect('/world');
  }

  const db = getServiceClient();

  // Get room record
  const { data: roomData } = await db
    .from('rooms')
    .select('id')
    .eq('slug', room)
    .single();

  if (!roomData) redirect('/world');

  // Fetch initial creatures, letters, and voice memos
  const [creaturesRes, lettersRes, memosRes] = await Promise.all([
    db
      .from('creatures')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    db
      .from('magic_letters')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('is_opened', false)
      .order('created_at', { ascending: true }),
    db
      .from('voice_memos')
      .select('*, sender:sender_family_id(display_name)')
      .eq('room_slug', room)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const creatures = (creaturesRes.data ?? []) as Creature[];
  const letters = (lettersRes.data ?? []) as MagicLetter[];

  // Flatten joined sender display_name into memo object
  const voiceMemos: VoiceMemo[] = (memosRes.data ?? []).map((row: Record<string, unknown>) => {
    const sender = row.sender as { display_name?: string | null } | null;
    return {
      ...row,
      sender: undefined,
      sender_display_name: sender?.display_name ?? null,
    } as VoiceMemo;
  });

  const roomSlug = room as RoomSlug;

  if (roomSlug === 'forest') {
    return <ForestRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} initialVoiceMemos={voiceMemos} />;
  }
  if (roomSlug === 'ocean') {
    return <OceanRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} initialVoiceMemos={voiceMemos} />;
  }
  if (roomSlug === 'space') {
    return <SpaceRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} initialVoiceMemos={voiceMemos} />;
  }
  if (roomSlug === 'castle') {
    return <CastleRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} initialVoiceMemos={voiceMemos} />;
  }

  redirect('/world');
}

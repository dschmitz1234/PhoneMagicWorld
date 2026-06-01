import { getServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import ForestRoom from '@/components/rooms/ForestRoom';
import OceanRoom from '@/components/rooms/OceanRoom';
import SpaceRoom from '@/components/rooms/SpaceRoom';
import CastleRoom from '@/components/rooms/CastleRoom';
import { Creature, MagicLetter, RoomSlug } from '@/types';

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

  // Fetch initial creatures and letters
  const [creaturesRes, lettersRes] = await Promise.all([
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
  ]);

  const creatures = (creaturesRes.data ?? []) as Creature[];
  const letters = (lettersRes.data ?? []) as MagicLetter[];

  const roomSlug = room as RoomSlug;

  if (roomSlug === 'forest') {
    return <ForestRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} />;
  }
  if (roomSlug === 'ocean') {
    return <OceanRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} />;
  }
  if (roomSlug === 'space') {
    return <SpaceRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} />;
  }
  if (roomSlug === 'castle') {
    return <CastleRoom roomId={roomData.id} initialCreatures={creatures} initialLetters={letters} />;
  }

  redirect('/world');
}

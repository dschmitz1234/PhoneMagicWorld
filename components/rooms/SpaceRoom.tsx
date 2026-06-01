'use client';

/**
 * SPACE ROOM — Cosmic void with React Three Fiber background
 * Three.js canvas for stars/nebula/planets, 2D overlay for creatures & UI
 */

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Creature, MagicLetter } from '@/types';
import CreatureSprite from '@/components/creatures/CreatureSprite';
import CreatureTooltip from '@/components/layout/CreatureTooltip';
import { NarrationToastQueue } from '@/components/ui/NarrationToast';
import RoomShell from '@/components/layout/RoomShell';
import MagicOracle from '@/components/ui/MagicOracle';
import MagicLetterComponent from '@/components/ui/MagicLetter';

// Dynamically import the 3D canvas (no SSR)
const SpaceCanvas = dynamic(() => import('@/components/rooms/SpaceCanvas'), { ssr: false });

import type { Engine } from '@tsparticles/engine';
const ParticlesProvider = dynamic(() => import('@tsparticles/react').then(m => ({ default: m.ParticlesProvider })), { ssr: false });
const Particles = dynamic(() => import('@tsparticles/react').then(m => ({ default: m.Particles })), { ssr: false });

interface SpaceRoomProps {
  roomId: string;
  initialCreatures: Creature[];
  initialLetters: MagicLetter[];
}

interface ToastItem {
  id: string;
  narration: string;
  realWorldPrompt?: string;
}

export default function SpaceRoom({ roomId, initialCreatures, initialLetters }: SpaceRoomProps) {
  const [creatures, setCreatures] = useState<Creature[]>(initialCreatures);
  const [letters, setLetters] = useState<MagicLetter[]>(initialLetters);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const roomRef = useRef<HTMLDivElement>(null);

  const initParticles = useCallback(async (engine: Engine) => {
    const { loadSlim } = await import('@tsparticles/slim');
    await loadSlim(engine);
  }, []);
  const [bounds, setBounds] = useState({ width: 1200, height: 700 });

  useEffect(() => {
    const update = () => {
      if (roomRef.current) setBounds({ width: roomRef.current.offsetWidth, height: roomRef.current.offsetHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const addToast = useCallback((narration: string, realWorldPrompt?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, narration, realWorldPrompt }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'creatures', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const c = payload.new as Creature;
          setCreatures(prev => [...prev, c]);
          addToast(`${c.name} has materialised in the Space Room...`);
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'magic_letters', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setLetters(prev => [...prev, payload.new as MagicLetter]);
          addToast('A paper crane drifts through the void...');
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, addToast]);



  const cosmicDustOptions = {
    particles: {
      number: { value: 80 },
      size: { value: { min: 1, max: 2 } },
      color: { value: ['#ffffff', '#c0a0ff', '#a0c8ff'] },
      opacity: { value: { min: 0.1, max: 0.6 }, animation: { enable: true, speed: 0.3, sync: false } },
      move: { enable: true, speed: 0.15, direction: 'none' as const, random: true },
      shape: { type: 'circle' },
    },
    detectRetina: true,
    background: { color: 'transparent' },
  };

  return (
    <RoomShell audioSrc="/audio/space-ambient.mp3" volume={0.15}>
      <div
        ref={roomRef}
        className="relative w-full h-screen overflow-hidden select-none"
        style={{ background: '#04010d' }}
        onClick={() => setSelectedCreature(null)}
      >
        {/* React Three Fiber 3D background */}
        <div className="absolute inset-0 pointer-events-none">
          <SpaceCanvas />
        </div>

        {/* 2D overlay with tsParticles cosmic dust */}
        <ParticlesProvider init={initParticles}>
          <Particles id="space-dust" options={cosmicDustOptions} className="absolute inset-0 pointer-events-none" />
        </ParticlesProvider>

        {/* Creatures (float weightlessly — no ground constraint) */}
        {creatures.map(creature => (
          <CreatureSprite
            key={creature.id}
            creature={creature}
            roomBounds={bounds}
            onCreatureClick={(c) => setSelectedCreature(c)}
          />
        ))}

        {/* Magic Letters */}
        {letters.map(letter => (
          <MagicLetterComponent key={letter.id} letter={letter} roomVariant="space" />
        ))}

        {/* Creature tooltip */}
        {selectedCreature && (
          <CreatureTooltip creature={selectedCreature} onClose={() => setSelectedCreature(null)} />
        )}

        {/* Narration toasts */}
        <NarrationToastQueue toasts={toasts} onDismiss={dismissToast} />

        {/* AI Oracle chat */}
        <MagicOracle room="space" />

        {/* Room label */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <h2 className="text-white/50 text-sm tracking-[0.4em] uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            The Space Room
          </h2>
        </div>
      </div>
    </RoomShell>
  );
}

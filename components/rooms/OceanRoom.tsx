'use client';

/**
 * OCEAN ROOM — Deep underwater world
 * Layers: deep water gradient → rock formations → coral reef → kelp → sea floor → surface
 * Particles: rising bubbles + plankton + marine snow
 * Creatures: moon_jellyfish (mid-water), tide_turtle (lower)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Creature, MagicLetter, VoiceMemo } from '@/types';
import CreatureSprite from '@/components/creatures/CreatureSprite';
import CreatureTooltip from '@/components/layout/CreatureTooltip';
import { NarrationToastQueue } from '@/components/ui/NarrationToast';
import RoomShell from '@/components/layout/RoomShell';
import MagicOracle from '@/components/ui/MagicOracle';
import MagicLetterComponent from '@/components/ui/MagicLetter';
import VoiceMemoOrb from '@/components/ui/VoiceMemoOrb';

import type { Engine } from '@tsparticles/engine';
const ParticlesProvider = dynamic(() => import('@tsparticles/react').then((m) => ({ default: m.ParticlesProvider })), { ssr: false });
const Particles = dynamic(() => import('@tsparticles/react').then((m) => ({ default: m.Particles })), { ssr: false });

interface OceanRoomProps {
  roomId: string;
  initialCreatures: Creature[];
  initialLetters: MagicLetter[];
  initialVoiceMemos: VoiceMemo[];
}

interface ToastItem {
  id: string;
  narration: string;
  realWorldPrompt?: string;
}

export default function OceanRoom({ roomId, initialCreatures, initialLetters, initialVoiceMemos }: OceanRoomProps) {
  const [creatures, setCreatures] = useState<Creature[]>(initialCreatures);
  const [letters, setLetters] = useState<MagicLetter[]>(initialLetters);
  const [voiceMemos, setVoiceMemos] = useState<VoiceMemo[]>(initialVoiceMemos);
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
          addToast(`${c.name} has drifted into the Ocean Room...`);
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'magic_letters', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setLetters(prev => [...prev, payload.new as MagicLetter]);
          addToast('A message in a bottle has washed ashore...');
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'voice_memos', filter: `room_slug=eq.ocean` },
        (payload) => {
          setVoiceMemos(prev => [payload.new as VoiceMemo, ...prev]);
          addToast('A magical voice message has drifted into the Ocean Room...');
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, addToast]);



  const bubbleOptions = {
    particles: {
      number: { value: 25 },
      size: { value: { min: 3, max: 10 } },
      color: { value: '#ffffff' },
      opacity: { value: { min: 0.3, max: 0.6 }, animation: { enable: true, speed: 0.5, sync: false } },
      move: { enable: true, speed: { min: 0.3, max: 0.7 }, direction: 'top' as const, random: true, warp: false },
      shape: { type: 'circle' },
    },
    detectRetina: true,
    background: { color: 'transparent' },
  };

  return (
    <RoomShell audioSrc="/audio/ocean-ambient.mp3" volume={0.2}>
      <div
        ref={roomRef}
        className="relative w-full h-screen overflow-hidden select-none"
        onClick={() => setSelectedCreature(null)}
        style={{ background: 'linear-gradient(180deg, #001a33 0%, #002d4d 30%, #003d5c 70%, #001520 100%)' }}
      >
        {/* Caustic light ripples from above */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute top-0 pointer-events-none"
            style={{
              left: `${15 + i * 30}%`,
              width: '25%',
              height: '40%',
              background: 'radial-gradient(ellipse, rgba(0,170,200,0.06) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
            animate={{ opacity: [0.3, 0.8, 0.3], y: [0, 10, 0] }}
            transition={{ duration: 4 + i, delay: i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Layer 1 — Distant rock formations */}
        <div className="absolute bottom-0 w-full pointer-events-none" style={{ height: '55%' }}>
          <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
            <path d="M0,280 Q120,200 200,280 Q300,180 400,280 Q520,200 640,280 Q760,180 900,280 Q1000,200 1100,280 Q1150,240 1200,280 L1200,400 L0,400 Z" fill="#001224" />
          </svg>
        </div>

        {/* Layer 2 — Coral reef */}
        <div className="absolute bottom-0 w-full pointer-events-none" style={{ height: '42%' }}>
          <svg viewBox="0 0 1200 340" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
            {/* Branching corals */}
            {[
              { x: 100, colour: '#c8523a', h: 120 },
              { x: 250, colour: '#8b2fc0', h: 90 },
              { x: 400, colour: '#e87d4a', h: 110 },
              { x: 600, colour: '#2fc0a0', h: 100 },
              { x: 780, colour: '#c8523a', h: 130 },
              { x: 950, colour: '#8b2fc0', h: 85 },
              { x: 1100, colour: '#e87d4a', h: 105 },
            ].map((coral, ci) => (
              <motion.g key={ci} style={{ originX: `${coral.x}px`, originY: '340px' }}
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ duration: 3 + ci * 0.3, delay: ci * 0.4, repeat: Infinity, ease: 'easeInOut' }}>
                {/* Main branch */}
                <line x1={coral.x} y1={340} x2={coral.x} y2={340 - coral.h} stroke={coral.colour} strokeWidth="6" strokeLinecap="round" />
                {/* Side branches */}
                <line x1={coral.x} y1={340 - coral.h * 0.5} x2={coral.x - 30} y2={340 - coral.h * 0.75} stroke={coral.colour} strokeWidth="4" strokeLinecap="round" />
                <line x1={coral.x} y1={340 - coral.h * 0.6} x2={coral.x + 25} y2={340 - coral.h * 0.85} stroke={coral.colour} strokeWidth="4" strokeLinecap="round" />
                <circle cx={coral.x} cy={340 - coral.h} r="5" fill={coral.colour} />
                <circle cx={coral.x - 30} cy={340 - coral.h * 0.75} r="4" fill={coral.colour} />
                <circle cx={coral.x + 25} cy={340 - coral.h * 0.85} r="4" fill={coral.colour} />
              </motion.g>
            ))}
            <path d="M0,300 Q600,260 1200,300 L1200,340 L0,340 Z" fill="#001824" />
          </svg>
        </div>

        {/* Layer 3 — Kelp forest */}
        <div className="absolute bottom-0 w-full pointer-events-none" style={{ height: '70%' }}>
          <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
            {[80, 200, 380, 550, 720, 900, 1080].map((kx, ki) => (
              <motion.path
                key={ki}
                d={`M${kx},560 Q${kx - 20},460 ${kx + 15},380 Q${kx - 10},300 ${kx + 5},200 Q${kx - 20},140 ${kx},80`}
                stroke="#2d6b2a"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                animate={{
                  d: [
                    `M${kx},560 Q${kx - 20},460 ${kx + 15},380 Q${kx - 10},300 ${kx + 5},200 Q${kx - 20},140 ${kx},80`,
                    `M${kx},560 Q${kx + 20},460 ${kx - 10},380 Q${kx + 15},300 ${kx - 5},200 Q${kx + 15},140 ${kx},80`,
                  ],
                }}
                transition={{ duration: 4 + ki * 0.5, delay: ki * 0.3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                opacity="0.7"
              />
            ))}
          </svg>
        </div>

        {/* Water surface shimmer at top */}
        <motion.div
          className="absolute top-0 w-full pointer-events-none"
          style={{ height: 60, background: 'linear-gradient(180deg, rgba(0,170,204,0.12) 0%, transparent 100%)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Bubbles particles */}
        <ParticlesProvider init={initParticles}>
          <Particles id="ocean-bubbles" options={bubbleOptions} className="absolute inset-0 pointer-events-none" />
        </ParticlesProvider>

        {/* Creatures */}
        {creatures.map(creature => (
          <CreatureSprite
            key={creature.id}
            creature={creature}
            roomBounds={bounds}
            onCreatureClick={(c) => { setSelectedCreature(c); }}
          />
        ))}

        {/* Magic Letters */}
        {letters.map(letter => (
          <MagicLetterComponent key={letter.id} letter={letter} roomVariant="ocean" />
        ))}

        {/* Creature tooltip */}
        {selectedCreature && (
          <CreatureTooltip
            creature={selectedCreature}
            onClose={() => setSelectedCreature(null)}
          />
        )}

        {/* Narration toasts */}
        <NarrationToastQueue toasts={toasts} onDismiss={dismissToast} />

        {/* AI Oracle chat */}
        <MagicOracle room="ocean" />

        {/* Voice memo orbs */}
        {voiceMemos.map((memo) => (
          <VoiceMemoOrb key={memo.id} memo={memo} />
        ))}

        {/* Room label */}}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <h2 className="text-white/60 text-sm tracking-[0.3em] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
            The Ocean Room
          </h2>
        </div>
      </div>
    </RoomShell>
  );
}

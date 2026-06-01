'use client';

/**
 * FOREST ROOM — COMPLETE ANIMATION SPECIFICATION
 * =================================================
 * Visual layers (back to front):
 *  0. Sky gradient (#1a3a2a → #4a7c59)
 *  1. Distant tree silhouette SVG — parallax 0.05×
 *  2. Mid-ground trees SVG — parallax 0.1×, individual sway
 *  3. Ground plane — moss, mushrooms, ferns
 *  4. Foreground roots/grass SVG — parallax 0.2×
 *
 * Particles: 18 fireflies, 5 falling leaves, light shafts
 * Creatures: ground level y 60-85%, max 6 visible
 * Ambient audio: /public/audio/forest-ambient.mp3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Creature, MagicLetter } from '@/types';
import CreatureSprite from '@/components/creatures/CreatureSprite';
import CreatureTooltip from '@/components/layout/CreatureTooltip';
import { NarrationToastQueue } from '@/components/ui/NarrationToast';
import RoomShell from '@/components/layout/RoomShell';
import MagicOracle from '@/components/ui/MagicOracle';

// Lazy-load tsParticles to keep initial bundle small
import type { Engine } from '@tsparticles/engine';
const ParticlesProvider = dynamic(() => import('@tsparticles/react').then((m) => ({ default: m.ParticlesProvider })), { ssr: false });
const Particles = dynamic(() => import('@tsparticles/react').then((m) => ({ default: m.Particles })), { ssr: false });

interface ForestRoomProps {
  roomId: string;
  initialCreatures: Creature[];
  initialLetters: MagicLetter[];
}

interface ToastItem {
  id: string;
  narration: string;
  realWorldPrompt?: string;
}

export default function ForestRoom({
  roomId,
  initialCreatures,
  initialLetters,
}: ForestRoomProps) {
  const [creatures, setCreatures] = useState<Creature[]>(initialCreatures);
  const [letters, setLetters] = useState<MagicLetter[]>(initialLetters);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const roomRef = useRef<HTMLDivElement>(null);

  const initParticles = useCallback(async (engine: Engine) => {
    const { loadSlim } = await import('@tsparticles/slim');
    await loadSlim(engine);
  }, []);
  const [bounds, setBounds] = useState({ width: 1200, height: 700 });

  // Measure room bounds
  useEffect(() => {
    const update = () => {
      if (roomRef.current) {
        setBounds({
          width: roomRef.current.offsetWidth,
          height: roomRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Mouse parallax tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = roomRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMousePos({
        x: (e.clientX - rect.left - rect.width / 2) / rect.width,
        y: (e.clientY - rect.top - rect.height / 2) / rect.height,
      });
    },
    []
  );

  const addToast = useCallback((narration: string, realWorldPrompt?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, narration, realWorldPrompt }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Supabase Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'creatures', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newCreature = payload.new as Creature;
          setCreatures((prev) => [...prev, newCreature]);
          addToast(`${newCreature.name} has arrived in the Forest Room...`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'magic_letters', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setLetters((prev) => [...prev, payload.new as MagicLetter]);
          addToast('A new letter has appeared in the forest...');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, addToast]);



  const fireflyOptions = {
    particles: {
      number: { value: 18 },
      size: { value: { min: 2, max: 4 } },
      color: { value: '#ffe066' },
      opacity: { value: { min: 0.2, max: 1 }, animation: { enable: true, speed: 0.8, sync: false } },
      move: {
        enable: true,
        speed: { min: 0.3, max: 0.8 },
        direction: 'none' as const,
        random: true,
        straight: false,
        warp: false,
      },
      shape: { type: 'circle' },
    },
    detectRetina: true,
    background: { color: 'transparent' },
  };

  return (
    <RoomShell audioSrc="/audio/forest-ambient.mp3">
      <div
        ref={roomRef}
        className="relative w-full h-screen overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        style={{
          background: 'linear-gradient(180deg, #1a3a2a 0%, #2d5a3d 40%, #4a7c59 100%)',
        }}
      >
        {/* Light shafts */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              width: 100 + i * 20,
              height: '140%',
              top: '-20%',
              left: `${15 + i * 22}%`,
              background:
                'linear-gradient(45deg, rgba(255,220,150,0.06) 0%, transparent 60%)',
              transform: 'rotate(15deg)',
            }}
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 6, delay: i * 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Layer 1 — Distant tree silhouette (parallax 0.05×) */}
        <motion.div
          className="absolute bottom-0 w-full pointer-events-none"
          style={{
            height: '50%',
            x: mousePos.x * -30,
            y: mousePos.y * -10,
          }}
          transition={{ type: 'spring', damping: 40, stiffness: 60 }}
        >
          <svg
            viewBox="0 0 1200 350"
            preserveAspectRatio="xMidYMax slice"
            className="w-full h-full"
          >
            <path
              d="M0,200 L80,100 L120,180 L180,60 L240,160 L300,80 L380,180 L440,40 L520,160 L600,100 L680,170 L760,50 L840,160 L920,90 L1000,180 L1080,60 L1160,150 L1200,200 L1200,350 L0,350 Z"
              fill="#0d2619"
            />
          </svg>
        </motion.div>

        {/* Layer 2 — Mid-ground trees (parallax 0.1×) */}
        <motion.div
          className="absolute bottom-0 w-full pointer-events-none"
          style={{
            height: '60%',
            x: mousePos.x * -60,
            y: mousePos.y * -15,
          }}
          transition={{ type: 'spring', damping: 40, stiffness: 60 }}
        >
          <svg
            viewBox="0 0 1200 420"
            preserveAspectRatio="xMidYMax slice"
            className="w-full h-full"
          >
            {/* Individual trees with sway */}
            {[
              { x: 80, colour: '#1a4228', delay: 0, duration: 3.8 },
              { x: 220, colour: '#2a5c38', delay: 0.5, duration: 4.2 },
              { x: 380, colour: '#1e4f30', delay: 1, duration: 3.6 },
              { x: 560, colour: '#1a4228', delay: 0.3, duration: 4.0 },
              { x: 740, colour: '#2a5c38', delay: 0.8, duration: 3.9 },
              { x: 920, colour: '#1e4f30', delay: 0.2, duration: 4.1 },
              { x: 1080, colour: '#1a4228', delay: 0.6, duration: 3.7 },
            ].map((tree) => (
              <motion.g
                key={tree.x}
                style={{ originX: `${tree.x}px`, originY: '420px' }}
                animate={{ rotate: [-1.5, 1.5, -1.5] }}
                transition={{ duration: tree.duration, delay: tree.delay, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Trunk */}
                <rect x={tree.x - 8} y={280} width={16} height={140} fill="#0d1f0f" />
                {/* Canopy */}
                <ellipse cx={tree.x} cy={220} rx={60} ry={80} fill={tree.colour} />
                <ellipse cx={tree.x} cy={180} rx={40} ry={60} fill={tree.colour} opacity="0.9" />
              </motion.g>
            ))}
            <path d="M0,380 Q600,320 1200,380 L1200,420 L0,420 Z" fill="#1e3d16" />
          </svg>
        </motion.div>

        {/* Layer 3 — Ground plane */}
        <div
          className="absolute bottom-0 w-full pointer-events-none"
          style={{ height: '35%' }}
        >
          <div
            className="w-full h-full"
            style={{
              background: 'radial-gradient(ellipse at center, #3a6b2a 0%, #1e3d16 70%)',
            }}
          />
          {/* Mushroom clusters */}
          <svg
            className="absolute bottom-0 w-full"
            viewBox="0 0 1200 200"
            preserveAspectRatio="xMidYMax slice"
          >
            {[180, 500, 850, 1050].map((mx) => (
              <g key={mx}>
                <ellipse cx={mx} cy={190} rx={12} ry={5} fill="rgba(0,0,0,0.2)" />
                <rect x={mx - 3} y={165} width={6} height={28} fill="#f0e6d2" rx="3" />
                <ellipse cx={mx} cy={162} rx={14} ry={9} fill="#c84a1a" />
                <circle cx={mx - 4} cy={160} r={2} fill="white" opacity="0.6" />
                <circle cx={mx + 3} cy={158} r={1.5} fill="white" opacity="0.6" />
              </g>
            ))}
          </svg>
        </div>

        {/* Layer 4 — Foreground roots/grass (parallax 0.2×) */}
        <motion.div
          className="absolute bottom-0 w-full pointer-events-none"
          style={{
            height: '25%',
            x: mousePos.x * -120,
            y: mousePos.y * -20,
          }}
          transition={{ type: 'spring', damping: 40, stiffness: 60 }}
        >
          <svg viewBox="0 0 1200 180" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
            <path
              d="M0,100 Q100,60 200,100 Q320,140 440,90 Q560,50 700,100 Q820,140 960,80 Q1060,50 1200,90 L1200,180 L0,180 Z"
              fill="#0d1f0f"
            />
            {/* Grass blades */}
            {Array.from({ length: 30 }).map((_, i) => {
              const bx = (i / 30) * 1200;
              return (
                <motion.line
                  key={i}
                  x1={bx}
                  y1={100}
                  x2={bx + 8}
                  y2={70}
                  stroke="#2a4a1a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{ rotate: [-3, 3, -3] }}
                  transition={{
                    duration: 2.5 + (i % 5) * 0.3,
                    delay: (i % 7) * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ originX: `${bx}px`, originY: '100px' }}
                />
              );
            })}
          </svg>
        </motion.div>

        {/* Firefly particles */}
        <ParticlesProvider init={initParticles}>
          <Particles
            id="forest-fireflies"
            className="absolute inset-0 pointer-events-none"
            options={fireflyOptions}
          />
        </ParticlesProvider>

        {/* Creatures */}
        {creatures.filter((c) => c.is_active).slice(0, 6).map((creature) => (
          <CreatureSprite
            key={creature.id}
            creature={creature}
            roomBounds={bounds}
            onCreatureClick={(c) => setSelectedCreature(c)}
          />
        ))}

        {/* Room title */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <h2
            className="text-white/60 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            The Forest Room
          </h2>
        </div>

        {/* Creature tooltip */}
        <CreatureTooltip
          creature={selectedCreature}
          onClose={() => setSelectedCreature(null)}
        />

        {/* Narration toasts */}
        <NarrationToastQueue toasts={toasts} onDismiss={dismissToast} />

        {/* AI Oracle chat */}
        <MagicOracle room="forest" />
      </div>
    </RoomShell>
  );
}

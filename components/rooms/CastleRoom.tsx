'use client';

/**
 * CASTLE ROOM — Ancient stone halls, fireplace, torches, ravens
 * Layers: night sky through windows → stone walls → fireplace → tapestries → torches → floor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Creature, MagicLetter } from '@/types';
import CreatureSprite from '@/components/creatures/CreatureSprite';
import CreatureTooltip from '@/components/layout/CreatureTooltip';
import { NarrationToastQueue } from '@/components/ui/NarrationToast';
import RoomShell from '@/components/layout/RoomShell';
import MagicOracle from '@/components/ui/MagicOracle';
import MagicLetterComponent from '@/components/ui/MagicLetter';

// Deterministic star positions — computed once at module level to avoid hydration mismatch
const WINDOW_STARS = Array.from({ length: 2 }, (_, wi) =>
  Array.from({ length: 12 }, (_, si) => {
    const seed = wi * 100 + si;
    return {
      left: `${10 + (seed * 17 + 23) % 80}%`,
      top: `${10 + (seed * 11 + 17) % 60}%`,
      duration: 1.5 + ((seed * 7 + 3) % 20) / 10,
      delay: ((seed * 13 + 5) % 30) / 10,
    };
  })
);

// Flame shape variants for flicker animation
const FLAME_PATHS = [
  'M50,80 Q40,55 50,30 Q60,10 50,0 Q70,15 65,40 Q80,25 70,50 Q80,60 65,80 Z',
  'M50,80 Q35,50 48,25 Q55,8 52,0 Q68,18 62,42 Q75,28 68,52 Q78,65 63,80 Z',
  'M50,80 Q42,58 52,32 Q62,12 48,0 Q65,12 67,38 Q82,22 72,48 Q84,58 67,80 Z',
];

function FlickerFlame({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  const [flameIdx, setFlameIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlameIdx(i => (i + 1) % FLAME_PATHS.length);
    }, 100 + Math.random() * 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <g transform={`translate(${x - 50 * size}, ${y - 80 * size}) scale(${size})`}>
      {/* Outer flame */}
      <path d={FLAME_PATHS[flameIdx]} fill="#ff6600" opacity="0.9" />
      {/* Mid flame */}
      <path d={FLAME_PATHS[(flameIdx + 1) % 3]} fill="#ff9900" transform="translate(8,10) scale(0.75)" opacity="0.85" />
      {/* Inner flame */}
      <path d={FLAME_PATHS[(flameIdx + 2) % 3]} fill="#ffcc00" transform="translate(18,20) scale(0.5)" opacity="0.9" />
      {/* Core */}
      <ellipse cx="50" cy="65" rx="10" ry="8" fill="#fff3b0" opacity="0.8" />
    </g>
  );
}

interface CastleRoomProps {
  roomId: string;
  initialCreatures: Creature[];
  initialLetters: MagicLetter[];
}

interface ToastItem {
  id: string;
  narration: string;
  realWorldPrompt?: string;
}

export default function CastleRoom({ roomId, initialCreatures, initialLetters }: CastleRoomProps) {
  const [creatures, setCreatures] = useState<Creature[]>(initialCreatures);
  const [letters, setLetters] = useState<MagicLetter[]>(initialLetters);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ravenVisible, setRavenVisible] = useState(false);
  const [ravenPos, setRavenPos] = useState(-60);
  const [wingOpen, setWingOpen] = useState(true);
  const roomRef = useRef<HTMLDivElement>(null);
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

  // Raven ambient pass
  useEffect(() => {
    let cancelled = false;
    async function ravenLoop() {
      while (!cancelled) {
        await sleep(45000 + Math.random() * 75000);
        if (cancelled) break;
        setRavenPos(-60);
        setRavenVisible(true);
        // Wing beat
        const wingInterval = setInterval(() => setWingOpen(w => !w), 150);
        await sleep(3500);
        clearInterval(wingInterval);
        setRavenVisible(false);
      }
    }
    ravenLoop();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ravenVisible) return;
    const start = Date.now();
    const duration = 3500;
    const frame = () => {
      const elapsed = Date.now() - start;
      setRavenPos(-60 + (elapsed / duration) * (bounds.width + 120));
      if (elapsed < duration) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [ravenVisible, bounds.width]);

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'creatures', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const c = payload.new as Creature;
          setCreatures(prev => [...prev, c]);
          addToast(`${c.name} has entered the Castle Room...`);
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'magic_letters', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setLetters(prev => [...prev, payload.new as MagicLetter]);
          addToast('A sealed scroll appears on the stone table...');
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, addToast]);

  return (
    <RoomShell audioSrc="/audio/castle-ambient.mp3" volume={0.2}>
      <div
        ref={roomRef}
        className="relative w-full h-screen overflow-hidden select-none"
        style={{ background: '#0f0d0a' }}
        onClick={() => setSelectedCreature(null)}
      >
        {/* Stone wall background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id="stonePattern" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
                <rect width="120" height="60" fill="#2a2520" />
                <rect x="2" y="2" width="116" height="56" fill="#221e18" rx="1" />
                <line x1="60" y1="0" x2="60" y2="60" stroke="#1a1510" strokeWidth="3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stonePattern)" opacity="0.7" />
          </svg>
        </div>

        {/* Arched windows with night sky */}
        {[20, 65].map((wx, wi) => (
          <div key={wi} className="absolute pointer-events-none" style={{ left: `${wx}%`, top: '5%', width: 120, height: 200 }}>
            {/* Arch clip */}
            <div style={{ width: 120, height: 200, borderRadius: '60px 60px 0 0', overflow: 'hidden', background: 'radial-gradient(ellipse, #1a1040 0%, #04010d 100%)' }}>
              {/* Moon */}
              {wi === 1 && (
                <div style={{ position: 'absolute', top: 20, right: 20, width: 28, height: 28, borderRadius: '50%', background: '#c8d8e8', boxShadow: '0 0 20px #c8d8e8aa' }} />
              )}
              {/* Window stars */}
              {WINDOW_STARS[wi].map((star, si) => (
                <motion.div
                  key={si}
                  className="absolute rounded-full bg-white"
                  style={{ width: 1.5, height: 1.5, left: star.left, top: star.top }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: star.duration, delay: star.delay, repeat: Infinity }}
                />
              ))}
            </div>
            {/* Stone window frame */}
            <div style={{ position: 'absolute', inset: -4, borderRadius: '64px 64px 0 0', border: '8px solid #3a3228', borderBottom: 'none' }} />
          </div>
        ))}

        {/* Fireplace centre back */}
        <div className="absolute pointer-events-none" style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)', width: 200 }}>
          {/* Fireplace opening */}
          <svg width={200} height={180} viewBox="0 0 200 180">
            <path d="M10,180 L10,60 Q10,20 50,20 L150,20 Q190,20 190,60 L190,180 Z" fill="#0a0805" />
            <path d="M25,180 L25,65 Q25,35 55,35 L145,35 Q175,35 175,65 L175,180 Z" fill="#110e0a" />
            {/* Mantelpiece */}
            <rect x="-20" y="15" width="240" height="20" fill="#3a2a15" rx="2" />
            {/* Stone surround */}
            <path d="M0,180 L0,55 Q0,5 55,5 L145,5 Q200,5 200,55 L200,180 Z" fill="none" stroke="#4a3820" strokeWidth="8" />
          </svg>
          {/* Actual flame */}
          <div style={{ position: 'absolute', bottom: 20, left: 50, width: 100, height: 100 }}>
            <svg width={100} height={100} viewBox="0 0 100 100">
              <FlickerFlame x={50} y={80} size={0.9} />
            </svg>
          </div>
          {/* Fireplace glow on floor */}
          <motion.div
            className="absolute"
            style={{ bottom: -30, left: -60, width: 320, height: 80, background: 'radial-gradient(ellipse, rgba(255,120,0,0.12) 0%, transparent 70%)', filter: 'blur(10px)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Wall torches */}
        {[0.15, 0.35, 0.65, 0.85].map((tx, ti) => (
          <div key={ti} className="absolute pointer-events-none" style={{ left: `${tx * 100}%`, top: '30%', width: 30, height: 60 }}>
            <svg width={30} height={60} viewBox="0 0 30 60">
              {/* Torch handle */}
              <rect x="13" y="20" width="4" height="40" fill="#5a3a18" rx="2" />
              {/* Torch head */}
              <rect x="10" y="10" width="10" height="16" fill="#7a4a20" rx="1" />
            </svg>
            {/* Small flame */}
            <div style={{ position: 'absolute', top: -8, left: 0, width: 30, height: 30 }}>
              <svg width={30} height={30} viewBox="0 0 100 80">
                <FlickerFlame x={50} y={80} size={0.35} />
              </svg>
            </div>
            {/* Torch light glow on wall */}
            <motion.div
              className="absolute"
              style={{ top: -20, left: -30, width: 90, height: 90, background: `radial-gradient(ellipse, rgba(255,140,0,0.10) 0%, transparent 70%)`, filter: 'blur(8px)' }}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 0.25, delay: ti * 0.07, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        ))}

        {/* Tapestries */}
        {[25, 75].map((tapX, ti) => (
          <motion.div
            key={ti}
            className="absolute pointer-events-none"
            style={{ left: `${tapX}%`, top: '8%', width: 80, height: 160, transform: 'translateX(-50%)' }}
            animate={{ scaleX: [1, 1.02, 0.99, 1] }}
            transition={{ duration: 3 + ti * 0.8, delay: ti * 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width={80} height={160} viewBox="0 0 80 160">
              {/* Tapestry background */}
              <rect x="5" y="0" width="70" height="155" fill="#4a2a0a" rx="2" />
              {/* Heraldic pattern */}
              <rect x="15" y="10" width="50" height="135" fill="#3a1e08" />
              <polygon points="40,20 55,40 40,60 25,40" fill="#c8a030" opacity="0.7" />
              <rect x="30" y="65" width="20" height="35" fill="#c8a030" opacity="0.5" />
              <polygon points="40,105 55,125 40,145 25,125" fill="#c8a030" opacity="0.7" />
              {/* Rod at top */}
              <rect x="0" y="0" width="80" height="6" fill="#6a4a20" rx="2" />
            </svg>
          </motion.div>
        ))}

        {/* Stone floor */}
        <div className="absolute bottom-0 w-full pointer-events-none" style={{ height: '18%' }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', bottom: 0 }}>
            <defs>
              <pattern id="floorPattern" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
                <rect width="100" height="50" fill="#1e1a14" />
                <rect x="2" y="2" width="96" height="46" fill="#1a1610" rx="1" />
                <line x1="50" y1="0" x2="50" y2="50" stroke="#120f0a" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#floorPattern)" />
            {/* Fireplace reflection on floor */}
            <ellipse cx="50%" cy="100%" rx="15%" ry="40%" fill="rgba(255,120,0,0.06)" />
          </svg>
        </div>

        {/* Raven ambient */}
        {ravenVisible && (
          <svg
            className="absolute pointer-events-none"
            style={{ top: '10%', left: ravenPos, transition: 'none' }}
            width={60}
            height={30}
            viewBox="0 0 60 30"
          >
            {/* Simple raven silhouette */}
            <ellipse cx="30" cy="20" rx="14" ry="8" fill="#0d0d0d" />
            {/* Wings */}
            {wingOpen ? (
              <>
                <ellipse cx="12" cy="14" rx="16" ry="6" fill="#0d0d0d" transform="rotate(-15,12,14)" />
                <ellipse cx="48" cy="14" rx="16" ry="6" fill="#0d0d0d" transform="rotate(15,48,14)" />
              </>
            ) : (
              <>
                <ellipse cx="18" cy="18" rx="10" ry="4" fill="#0d0d0d" transform="rotate(-30,18,18)" />
                <ellipse cx="42" cy="18" rx="10" ry="4" fill="#0d0d0d" transform="rotate(30,42,18)" />
              </>
            )}
            {/* Head */}
            <circle cx="43" cy="15" r="6" fill="#0d0d0d" />
            <circle cx="46" cy="13" r="1.5" fill="#222" />
            <line x1="48" y1="15" x2="54" y2="16" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}

        {/* Creatures */}
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
          <MagicLetterComponent key={letter.id} letter={letter} roomVariant="castle" />
        ))}

        {/* Creature tooltip */}
        {selectedCreature && (
          <CreatureTooltip creature={selectedCreature} onClose={() => setSelectedCreature(null)} />
        )}

        {/* Narration toasts */}
        <NarrationToastQueue toasts={toasts} onDismiss={dismissToast} />

        {/* AI Oracle chat */}
        <MagicOracle room="castle" />

        {/* Room label */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <h2 className="text-white/50 text-sm tracking-[0.3em] uppercase" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            The Castle Room
          </h2>
        </div>
      </div>
    </RoomShell>
  );
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

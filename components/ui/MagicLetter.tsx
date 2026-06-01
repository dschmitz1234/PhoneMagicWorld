'use client';

/**
 * MagicLetter — 4 room variants:
 * - forest:  envelope + floating leaf seal
 * - ocean:   bottle + cork pop
 * - space:   origami paper crane
 * - castle:  scroll + ribbon unroll
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicLetter as MagicLetterType } from '@/types';

interface MagicLetterProps {
  letter: MagicLetterType;
  roomVariant: 'forest' | 'ocean' | 'space' | 'castle';
}

function ForestEnvelope({ colour, opened }: { colour: string; opened: boolean }) {
  return (
    <svg width="64" height="50" viewBox="0 0 64 50">
      <rect x="2" y="8" width="60" height="40" rx="3" fill={colour} stroke={`${colour}88`} strokeWidth="1.5" />
      <motion.path
        d="M2,8 L32,30 L62,8"
        stroke={`${colour}cc`}
        strokeWidth="1.5"
        fill="none"
        animate={opened ? { d: 'M2,8 L32,4 L62,8' } : { d: 'M2,8 L32,30 L62,8' }}
        transition={{ duration: 0.4 }}
      />
      {/* Leaf seal */}
      <motion.g
        style={{ originX: '32px', originY: '22px' }}
        animate={opened ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ellipse cx="32" cy="22" rx="8" ry="5" fill="#4a9a2a" transform="rotate(45, 32, 22)" />
        <ellipse cx="32" cy="22" rx="8" ry="5" fill="#3a7a22" transform="rotate(-45, 32, 22)" />
      </motion.g>
    </svg>
  );
}

function OceanBottle({ colour, opened }: { colour: string; opened: boolean }) {
  return (
    <svg width="40" height="80" viewBox="0 0 40 80">
      {/* Bottle body */}
      <path d="M10,30 Q6,35 6,60 Q6,74 20,74 Q34,74 34,60 Q34,35 30,30 Z" fill="#80b8cc" opacity="0.7" />
      {/* Bottle neck */}
      <rect x="15" y="10" width="10" height="22" fill="#80b8cc" opacity="0.7" />
      {/* Cork */}
      <motion.rect
        x="14" y="6" width="12" height="10" fill="#c8a060" rx="2"
        animate={opened ? { y: -20, opacity: 0 } : { y: 6, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Message inside (visible when opened) */}
      <motion.rect
        x="12" y="32" width="16" height="22" fill="#fff8e0" rx="1"
        animate={opened ? { y: 15, opacity: 1 } : { y: 32, opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      {/* Envelope flap */}
      <rect x="8" y="40" width="24" height="2" fill={colour} opacity={opened ? 0 : 0.5} />
    </svg>
  );
}

function SpaceCrane({ colour }: { colour: string }) {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      {/* Simple origami crane silhouette */}
      <polygon points="30,5 50,35 30,28 10,35" fill={colour} opacity="0.85" />
      <polygon points="30,28 50,35 30,55" fill={`${colour}aa`} />
      <polygon points="30,28 10,35 30,55" fill={`${colour}cc`} />
      {/* Wing highlight */}
      <line x1="30" y1="5" x2="30" y2="55" stroke={`${colour}55`} strokeWidth="1" />
      <line x1="10" y1="35" x2="50" y2="35" stroke={`${colour}55`} strokeWidth="1" />
    </svg>
  );
}

function CastleScroll({ colour, opened }: { colour: string; opened: boolean }) {
  return (
    <svg width="60" height="80" viewBox="0 0 60 80">
      {/* Scroll body */}
      <motion.rect
        x="8" y="12" width="44" height={opened ? 60 : 30} fill="#f5e6c8" rx="2"
        animate={opened ? { height: 60 } : { height: 30 }}
        transition={{ duration: 0.5 }}
      />
      {/* Top curl */}
      <ellipse cx="30" cy="12" rx="22" ry="6" fill="#e8d4a0" />
      {/* Bottom curl */}
      <motion.ellipse
        cx="30" cy={opened ? 72 : 42} rx="22" ry="6" fill="#e8d4a0"
        animate={opened ? { cy: 72 } : { cy: 42 }}
        transition={{ duration: 0.5 }}
      />
      {/* Ribbon */}
      <motion.path
        d="M22,30 Q30,38 38,30"
        stroke={colour}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        animate={opened ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      {/* Text lines when opened */}
      <motion.g animate={opened ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.3 }}>
        <line x1="16" y1="28" x2="44" y2="28" stroke="#a08060" strokeWidth="1.5" />
        <line x1="16" y1="36" x2="44" y2="36" stroke="#a08060" strokeWidth="1.5" />
        <line x1="16" y1="44" x2="36" y2="44" stroke="#a08060" strokeWidth="1.5" />
      </motion.g>
    </svg>
  );
}

export default function MagicLetter({ letter, roomVariant }: MagicLetterProps) {
  const [opened, setOpened] = useState(false);

  const x = letter.position_x * 100;
  const y = letter.position_y * 100;

  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
      <motion.div
        className="relative cursor-pointer"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => setOpened(true)}
        whileHover={{ scale: 1.1 }}
        title="Click to open"
      >
        {roomVariant === 'forest' && <ForestEnvelope colour={letter.envelope_colour} opened={opened} />}
        {roomVariant === 'ocean' && <OceanBottle colour={letter.envelope_colour} opened={opened} />}
        {roomVariant === 'space' && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <SpaceCrane colour={letter.envelope_colour} />
          </motion.div>
        )}
        {roomVariant === 'castle' && <CastleScroll colour={letter.envelope_colour} opened={opened} />}

        {/* Sparkle on click-to-open nudge (before opened) */}
        {!opened && (
          <motion.div
            className="absolute -top-2 -right-2 text-yellow-300 text-xs"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.div>
        )}
      </motion.div>

      {/* Letter content popup */}
      <AnimatePresence>
        {opened && (
          <motion.div
            className="absolute z-50 rounded-2xl p-4 w-64 text-center shadow-2xl"
            style={{
              background: 'rgba(10,8,20,0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${letter.envelope_colour}44`,
              boxShadow: `0 4px 40px ${letter.envelope_colour}33`,
              bottom: '110%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
          >
            <p className="text-xs text-white/50 mb-1 tracking-wider uppercase">From {letter.sender_name}</p>
            <p className="text-white/90 text-sm leading-relaxed" style={{ fontFamily: "'Caveat', cursive" }}>
              {letter.content_text}
            </p>
            <button
              className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
              onClick={() => setOpened(false)}
            >
              close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

interface MoonJellyfishProps {
  colourPrimary: string;
  colourSecondary: string;
}

const TENTACLE_COUNT = 6;

export default function MoonJellyfish({ colourPrimary, colourSecondary }: MoonJellyfishProps) {
  return (
    <div className="relative" style={{ width: 100, height: 140 }}>
      {/* Bioluminescent glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% 40%, ${colourPrimary}55 0%, transparent 70%)`,
          filter: 'blur(8px)',
          transform: 'scale(1.4)',
        }}
      />

      {/* Bell body */}
      <motion.svg
        width={100}
        height={70}
        viewBox="0 0 100 70"
        animate={{ scaleY: [1, 1.08, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'bottom center' }}
      >
        {/* Bell shape */}
        <ellipse cx="50" cy="35" rx="42" ry="32" fill={colourPrimary} opacity="0.7" />
        {/* Inner highlight */}
        <ellipse cx="50" cy="28" rx="28" ry="18" fill={colourSecondary} opacity="0.4" />
        {/* Oral arms internal pattern */}
        <ellipse cx="50" cy="45" rx="16" ry="12" fill={colourPrimary} opacity="0.5" />
        {/* Texture rings */}
        <ellipse cx="50" cy="30" rx="38" ry="28" fill="none" stroke={colourSecondary} strokeWidth="1" opacity="0.3" />
        <ellipse cx="50" cy="30" rx="26" ry="19" fill="none" stroke={colourSecondary} strokeWidth="1" opacity="0.3" />
      </motion.svg>

      {/* Tentacles */}
      {Array.from({ length: TENTACLE_COUNT }).map((_, i) => {
        const xBase = 18 + (i * 64) / (TENTACLE_COUNT - 1);
        const delay = i * 0.15;
        return (
          <motion.svg
            key={i}
            width={12}
            height={80}
            viewBox="0 0 12 80"
            style={{ position: 'absolute', top: 58, left: xBase - 6 }}
            animate={{ scaleX: [1, 1.3, 0.8, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 2.5 + i * 0.2, delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d={`M6 0 Q${4 + Math.sin(i) * 4} 20 ${6 + Math.cos(i) * 3} 40 Q${4} 60 6 80`}
              stroke={colourPrimary}
              strokeWidth="2"
              fill="none"
              opacity="0.7"
              strokeLinecap="round"
            />
          </motion.svg>
        );
      })}
    </div>
  );
}

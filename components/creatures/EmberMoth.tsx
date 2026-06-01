'use client';

import { motion } from 'framer-motion';

interface EmberMothProps {
  colourPrimary: string;
  colourSecondary: string;
}

export default function EmberMoth({ colourPrimary, colourSecondary }: EmberMothProps) {
  return (
    <div className="relative" style={{ width: 80, height: 70 }}>
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${colourPrimary}44 0%, transparent 70%)`,
          filter: 'blur(8px)',
          transform: 'scale(1.6)',
        }}
      />

      {/* Upper wings */}
      <motion.svg
        width={80}
        height={50}
        viewBox="0 0 80 50"
        style={{ position: 'absolute', top: 0 }}
        animate={{ scaleY: [1, -0.5, 1] }}
        transition={{ duration: 0.14, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Left wing — eye pattern */}
        <ellipse cx="20" cy="25" rx="18" ry="22" fill={colourPrimary} opacity="0.75" />
        <ellipse cx="20" cy="25" rx="10" ry="13" fill={colourSecondary} opacity="0.6" />
        <circle cx="20" cy="25" r="5" fill={colourPrimary} opacity="0.8" />
        <circle cx="20" cy="25" r="2" fill={colourSecondary} />

        {/* Right wing — eye pattern */}
        <ellipse cx="60" cy="25" rx="18" ry="22" fill={colourPrimary} opacity="0.75" />
        <ellipse cx="60" cy="25" rx="10" ry="13" fill={colourSecondary} opacity="0.6" />
        <circle cx="60" cy="25" r="5" fill={colourPrimary} opacity="0.8" />
        <circle cx="60" cy="25" r="2" fill={colourSecondary} />

        {/* Wing veins */}
        <line x1="40" y1="25" x2="6" y2="10" stroke={colourSecondary} strokeWidth="0.8" opacity="0.4" />
        <line x1="40" y1="25" x2="6" y2="40" stroke={colourSecondary} strokeWidth="0.8" opacity="0.4" />
        <line x1="40" y1="25" x2="74" y2="10" stroke={colourSecondary} strokeWidth="0.8" opacity="0.4" />
        <line x1="40" y1="25" x2="74" y2="40" stroke={colourSecondary} strokeWidth="0.8" opacity="0.4" />
      </motion.svg>

      {/* Lower smaller wings — counter-phase */}
      <motion.svg
        width={54}
        height={34}
        viewBox="0 0 54 34"
        style={{ position: 'absolute', top: 28, left: 13 }}
        animate={{ scaleY: [-0.5, 1, -0.5] }}
        transition={{ duration: 0.14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="14" cy="17" rx="12" ry="15" fill={colourPrimary} opacity="0.6" />
        <ellipse cx="40" cy="17" rx="12" ry="15" fill={colourPrimary} opacity="0.6" />
      </motion.svg>

      {/* Body */}
      <svg width={14} height={44} viewBox="0 0 14 44" style={{ position: 'absolute', top: 8, left: 33 }}>
        <ellipse cx="7" cy="8" r="6" fill={colourPrimary} />
        <ellipse cx="7" cy="8" r="3" fill={colourSecondary} opacity="0.7" />
        <ellipse cx="7" cy="22" rx="4" ry="8" fill={colourPrimary} opacity="0.9" />
        <ellipse cx="7" cy="36" rx="3" ry="6" fill={colourPrimary} opacity="0.7" />
        {/* Antennae */}
        <line x1="7" y1="4" x2="2" y2="-2" stroke={colourPrimary} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="4" x2="12" y2="-2" stroke={colourPrimary} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="2" cy="-2" r="1.5" fill={colourSecondary} />
        <circle cx="12" cy="-2" r="1.5" fill={colourSecondary} />
      </svg>

      {/* Ember particles rising from body */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: 3, height: 3, background: '#ff8800', left: 37 + i * 3, top: 40 }}
          animate={{ y: [0, -20, -30], opacity: [0.9, 0.5, 0], scale: [1, 0.8, 0.3] }}
          transition={{ duration: 1.2, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

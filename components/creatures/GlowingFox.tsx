'use client';

import { motion } from 'framer-motion';

interface GlowingFoxProps {
  colourPrimary: string;
  colourSecondary: string;
  scaleX?: number;
}

export default function GlowingFox({
  colourPrimary,
  colourSecondary,
  scaleX = 1,
}: GlowingFoxProps) {
  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      style={{ scaleX, originX: '50%' }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow filter */}
      <defs>
        <filter id="fox-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Tail — slightly offset, sways with delay */}
      <motion.path
        d="M 30 80 Q 10 60 20 40 Q 28 28 38 42"
        fill="none"
        stroke={colourPrimary}
        strokeWidth="10"
        strokeLinecap="round"
        filter="url(#fox-glow)"
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        style={{ originX: '38px', originY: '80px' }}
      />
      {/* Tail tip */}
      <circle cx="20" cy="40" r="7" fill={colourSecondary} filter="url(#fox-glow)" />

      {/* Body */}
      <ellipse cx="65" cy="78" rx="24" ry="18" fill={colourPrimary} />

      {/* Head */}
      <ellipse cx="68" cy="52" rx="20" ry="18" fill={colourPrimary} />

      {/* Ears */}
      <motion.path
        d="M 52 40 L 46 20 L 60 32 Z"
        fill={colourPrimary}
        animate={{ scaleY: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M 82 40 L 88 20 L 74 32 Z"
        fill={colourPrimary}
        animate={{ scaleY: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
      {/* Ear tips glow */}
      <circle cx="52" cy="25" r="4" fill={colourSecondary} opacity="0.8" filter="url(#fox-glow)" />
      <circle cx="82" cy="25" r="4" fill={colourSecondary} opacity="0.8" filter="url(#fox-glow)" />

      {/* Eyes */}
      <motion.circle
        cx="60"
        cy="50"
        r="5"
        fill={colourSecondary}
        filter="url(#fox-glow)"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="76"
        cy="50"
        r="5"
        fill={colourSecondary}
        filter="url(#fox-glow)"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      {/* Pupils */}
      <circle cx="61" cy="51" r="2.5" fill="#1a0f00" />
      <circle cx="77" cy="51" r="2.5" fill="#1a0f00" />

      {/* Snout */}
      <ellipse cx="68" cy="62" rx="8" ry="5" fill={colourSecondary} opacity="0.6" />
      <circle cx="68" cy="60" r="2" fill="#2a1200" />

      {/* Legs */}
      <rect x="52" y="90" width="8" height="16" rx="4" fill={colourPrimary} />
      <rect x="64" y="90" width="8" height="16" rx="4" fill={colourPrimary} />
      <rect x="74" y="90" width="8" height="14" rx="4" fill={colourPrimary} />
    </motion.svg>
  );
}

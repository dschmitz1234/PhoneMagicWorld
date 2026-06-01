'use client';

import { motion } from 'framer-motion';

interface TideTurtleProps {
  colourPrimary: string;
  colourSecondary: string;
}

import type { Transition } from 'framer-motion';

// Flipper swimming stroke animation
const FLIPPER_TRANSITION: Transition = { duration: 1.2, repeat: Infinity, ease: 'easeInOut' };
const FLIPPER_TRANSITION_REAR: Transition = { duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 };

const FLIPPER_STROKE = {
  animate: { rotate: [0, 30, -10, 0] },
  transition: FLIPPER_TRANSITION,
};

const FLIPPER_STROKE_REAR = {
  animate: { rotate: [0, 20, -8, 0] },
  transition: FLIPPER_TRANSITION_REAR,
};

export default function TideTurtle({ colourPrimary, colourSecondary }: TideTurtleProps) {
  return (
    <div className="relative" style={{ width: 110, height: 90 }}>
      {/* Glow underneath */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: '20%',
          width: '60%',
          height: 20,
          background: `radial-gradient(ellipse, ${colourPrimary}33 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
      />

      {/* Rear left flipper */}
      <motion.div
        style={{ position: 'absolute', top: 52, left: 4, transformOrigin: 'right center' }}
        {...FLIPPER_STROKE_REAR}
      >
        <svg width={30} height={18} viewBox="0 0 30 18">
          <ellipse cx="10" cy="9" rx="18" ry="8" fill={colourPrimary} opacity="0.8" />
        </svg>
      </motion.div>

      {/* Rear right flipper */}
      <motion.div
        style={{ position: 'absolute', top: 52, right: 4, transformOrigin: 'left center' }}
        animate={{ rotate: [0, -20, 8, 0] }}
        transition={FLIPPER_TRANSITION_REAR}
      >
        <svg width={30} height={18} viewBox="0 0 30 18">
          <ellipse cx="20" cy="9" rx="18" ry="8" fill={colourPrimary} opacity="0.8" />
        </svg>
      </motion.div>

      {/* Front left flipper */}
      <motion.div
        style={{ position: 'absolute', top: 24, left: 2, transformOrigin: 'right top' }}
        {...FLIPPER_STROKE}
      >
        <svg width={36} height={22} viewBox="0 0 36 22">
          <ellipse cx="10" cy="11" rx="24" ry="10" fill={colourPrimary} opacity="0.85" transform="rotate(-15, 10, 11)" />
        </svg>
      </motion.div>

      {/* Front right flipper */}
      <motion.div
        style={{ position: 'absolute', top: 24, right: 2, transformOrigin: 'left top' }}
        animate={{ rotate: [0, -30, 10, 0] }}
        transition={FLIPPER_TRANSITION}
      >
        <svg width={36} height={22} viewBox="0 0 36 22">
          <ellipse cx="26" cy="11" rx="24" ry="10" fill={colourPrimary} opacity="0.85" transform="rotate(15, 26, 11)" />
        </svg>
      </motion.div>

      {/* Shell */}
      <svg width={80} height={70} viewBox="0 0 80 70" style={{ position: 'absolute', top: 10, left: 15 }}>
        {/* Shell base */}
        <ellipse cx="40" cy="38" rx="34" ry="28" fill={colourPrimary} />
        {/* Geometric tile pattern */}
        <ellipse cx="40" cy="38" rx="24" ry="19" fill={colourSecondary} opacity="0.5" />
        {/* Scute pattern */}
        <polygon points="40,22 52,30 52,46 40,54 28,46 28,30" fill="none" stroke={colourSecondary} strokeWidth="1.5" opacity="0.6" />
        <polygon points="40,30 48,35 48,45 40,50 32,45 32,35" fill="none" stroke={colourSecondary} strokeWidth="1" opacity="0.4" />
        {/* Side scutes */}
        {[-1, 0, 1].map(i => (
          <ellipse key={`ls${i}`} cx="18" cy={30 + i * 9} rx="7" ry="5" fill={colourSecondary} opacity="0.3" transform={`rotate(-20, 18, ${30 + i * 9})`} />
        ))}
        {[-1, 0, 1].map(i => (
          <ellipse key={`rs${i}`} cx="62" cy={30 + i * 9} rx="7" ry="5" fill={colourSecondary} opacity="0.3" transform={`rotate(20, 62, ${30 + i * 9})`} />
        ))}
      </svg>

      {/* Head */}
      <motion.svg
        width={28}
        height={22}
        viewBox="0 0 28 22"
        style={{ position: 'absolute', top: 24, right: 4 }}
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="14" cy="11" rx="13" ry="10" fill={colourPrimary} />
        <circle cx="18" cy="8" r="3" fill={colourSecondary} />
        <circle cx="18" cy="8" r="1.5" fill="#1a1a1a" />
        <circle cx="17.5" cy="7.5" r="0.8" fill="white" opacity="0.8" />
        {/* Nostril */}
        <circle cx="24" cy="12" r="1" fill={colourSecondary} opacity="0.5" />
      </motion.svg>
    </div>
  );
}

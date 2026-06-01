'use client';

import { motion } from 'framer-motion';

interface StarDragonflyProps {
  colourPrimary: string;
  colourSecondary: string;
}

export default function StarDragonfly({ colourPrimary, colourSecondary }: StarDragonflyProps) {
  return (
    <div className="relative" style={{ width: 90, height: 60 }}>
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${colourPrimary}44 0%, transparent 70%)`,
          filter: 'blur(6px)',
          transform: 'scale(1.5)',
        }}
      />

      {/* Top wing pair */}
      <motion.svg
        width={90}
        height={30}
        viewBox="0 0 90 30"
        style={{ position: 'absolute', top: 4, left: 0 }}
        animate={{ scaleY: [1, -0.7, 1] }}
        transition={{ duration: 0.12, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="22" cy="15" rx="20" ry="11" fill={colourSecondary} opacity="0.7" />
        <ellipse cx="68" cy="15" rx="20" ry="11" fill={colourSecondary} opacity="0.7" />
        {/* Wing veins */}
        <line x1="22" y1="15" x2="4" y2="8" stroke={colourPrimary} strokeWidth="0.8" opacity="0.5" />
        <line x1="22" y1="15" x2="4" y2="22" stroke={colourPrimary} strokeWidth="0.8" opacity="0.5" />
        <line x1="68" y1="15" x2="86" y2="8" stroke={colourPrimary} strokeWidth="0.8" opacity="0.5" />
        <line x1="68" y1="15" x2="86" y2="22" stroke={colourPrimary} strokeWidth="0.8" opacity="0.5" />
      </motion.svg>

      {/* Bottom wing pair — slightly offset phase */}
      <motion.svg
        width={72}
        height={24}
        viewBox="0 0 72 24"
        style={{ position: 'absolute', top: 22, left: 9 }}
        animate={{ scaleY: [-0.7, 1, -0.7] }}
        transition={{ duration: 0.12, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="18" cy="12" rx="16" ry="9" fill={colourSecondary} opacity="0.55" />
        <ellipse cx="54" cy="12" rx="16" ry="9" fill={colourSecondary} opacity="0.55" />
      </motion.svg>

      {/* Body */}
      <svg
        width={24}
        height={56}
        viewBox="0 0 24 56"
        style={{ position: 'absolute', top: 2, left: 33 }}
      >
        {/* Head */}
        <circle cx="12" cy="8" r="7" fill={colourPrimary} />
        {/* Eyes */}
        <circle cx="8" cy="7" r="3" fill={colourSecondary} />
        <circle cx="16" cy="7" r="3" fill={colourSecondary} />
        <circle cx="8" cy="7" r="1.5" fill="#111" />
        <circle cx="16" cy="7" r="1.5" fill="#111" />
        {/* Thorax */}
        <ellipse cx="12" cy="20" rx="5" ry="7" fill={colourPrimary} />
        {/* Abdomen segments */}
        {[0, 1, 2, 3].map(i => (
          <ellipse key={i} cx="12" cy={32 + i * 6} rx={4 - i * 0.5} ry="4" fill={colourPrimary} opacity={1 - i * 0.1} />
        ))}
      </svg>

      {/* Star shimmer particles */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            background: colourSecondary,
            left: 30 + i * 10,
            top: 20 + i * 5,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 0.8, delay: i * 0.25, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

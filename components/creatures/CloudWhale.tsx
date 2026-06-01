'use client';

import { motion } from 'framer-motion';

interface CloudWhaleProps {
  colourPrimary: string;
  colourSecondary: string;
}

export default function CloudWhale({ colourPrimary, colourSecondary }: CloudWhaleProps) {
  return (
    <div className="relative" style={{ width: 200, height: 120 }}>
      {/* Belly glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: '10%',
          width: '80%',
          height: 40,
          background: `radial-gradient(ellipse, ${colourPrimary}55 0%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
      />

      {/* Star wake trail */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ width: 3, height: 3, right: -i * 14, top: 50 + i * 4 }}
          animate={{ opacity: [0.8, 0, 0.8], scale: [1, 0.3, 1] }}
          transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
        />
      ))}

      <svg width={200} height={110} viewBox="0 0 200 110">
        <defs>
          <filter id="cloudEdge">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Main body — soft cloud-edged whale */}
        <ellipse cx="90" cy="60" rx="80" ry="40" fill={colourPrimary} opacity="0.9" filter="url(#cloudEdge)" />

        {/* Belly */}
        <ellipse cx="90" cy="70" rx="55" ry="25" fill={colourSecondary} opacity="0.5" />

        {/* Cloud puffs on back */}
        <circle cx="60" cy="30" r="18" fill={colourPrimary} opacity="0.7" />
        <circle cx="90" cy="22" r="22" fill={colourPrimary} opacity="0.7" />
        <circle cx="120" cy="28" r="16" fill={colourPrimary} opacity="0.7" />
        <circle cx="45" cy="36" r="14" fill={colourPrimary} opacity="0.6" />
        <circle cx="140" cy="35" r="14" fill={colourPrimary} opacity="0.6" />

        {/* Head */}
        <circle cx="165" cy="58" r="28" fill={colourPrimary} opacity="0.9" />

        {/* Eye */}
        <circle cx="174" cy="52" r="6" fill={colourSecondary} />
        <circle cx="174" cy="52" r="3.5" fill="#1a1a2e" />
        <circle cx="173" cy="51" r="1.5" fill="white" opacity="0.8" />

        {/* Smile */}
        <path d="M158 62 Q165 68 172 62" stroke={colourSecondary} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />

        {/* Flippers */}
        <ellipse cx="60" cy="88" rx="25" ry="10" fill={colourPrimary} opacity="0.7" transform="rotate(-15, 60, 88)" />
        <ellipse cx="120" cy="90" rx="22" ry="9" fill={colourPrimary} opacity="0.7" transform="rotate(10, 120, 90)" />

        {/* Tail */}
        <path d="M10 60 Q-10 45 -5 35 Q5 50 10 60 Q-10 70 -5 80 Q5 75 10 60Z" fill={colourPrimary} opacity="0.8" />
      </svg>
    </div>
  );
}

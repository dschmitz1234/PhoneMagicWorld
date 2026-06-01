'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StoneOwlProps {
  colourPrimary: string;
  colourSecondary: string;
}

export default function StoneOwl({ colourPrimary, colourSecondary }: StoneOwlProps) {
  const [headAngle, setHeadAngle] = useState(0);
  const [eyesClosed, setEyesClosed] = useState(false);

  // Head turning logic
  useEffect(() => {
    let cancelled = false;
    async function turnLoop() {
      while (!cancelled) {
        await sleep(4000 + Math.random() * 4000);
        if (cancelled) break;
        setHeadAngle(-28);
        await sleep(2000);
        if (cancelled) break;
        setHeadAngle(0);
        await sleep(1500 + Math.random() * 2000);
        if (cancelled) break;
        setHeadAngle(28);
        await sleep(2000);
        if (cancelled) break;
        setHeadAngle(0);
      }
    }
    turnLoop();
    return () => { cancelled = true; };
  }, []);

  // Blink logic
  useEffect(() => {
    let cancelled = false;
    async function blinkLoop() {
      while (!cancelled) {
        await sleep(3000 + Math.random() * 4000);
        if (cancelled) break;
        setEyesClosed(true);
        await sleep(140);
        if (cancelled) break;
        setEyesClosed(false);
      }
    }
    blinkLoop();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative" style={{ width: 80, height: 110 }}>
      {/* Body */}
      <svg width={80} height={90} viewBox="0 0 80 90" style={{ position: 'absolute', top: 20 }}>
        {/* Main body */}
        <ellipse cx="40" cy="55" rx="28" ry="32" fill={colourPrimary} />
        {/* Chest lighter area */}
        <ellipse cx="40" cy="62" rx="18" ry="22" fill={colourSecondary} opacity="0.6" />
        {/* Wing feather texture */}
        {[0, 1, 2].map(i => (
          <path key={`lw${i}`} d={`M18 ${40 + i * 10} Q8 ${45 + i * 10} 12 ${50 + i * 10}`} stroke={colourPrimary} strokeWidth="2" fill="none" opacity="0.6" />
        ))}
        {[0, 1, 2].map(i => (
          <path key={`rw${i}`} d={`M62 ${40 + i * 10} Q72 ${45 + i * 10} 68 ${50 + i * 10}`} stroke={colourPrimary} strokeWidth="2" fill="none" opacity="0.6" />
        ))}
        {/* Talons */}
        <line x1="30" y1="85" x2="22" y2="92" stroke={colourPrimary} strokeWidth="3" strokeLinecap="round" />
        <line x1="36" y1="86" x2="34" y2="94" stroke={colourPrimary} strokeWidth="3" strokeLinecap="round" />
        <line x1="44" y1="86" x2="46" y2="94" stroke={colourPrimary} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="85" x2="58" y2="92" stroke={colourPrimary} strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Head — rotates independently */}
      <motion.div
        style={{ position: 'absolute', top: 0, left: 10, width: 60, height: 60, transformOrigin: 'bottom center' }}
        animate={{ rotate: headAngle }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      >
        <svg width={60} height={60} viewBox="0 0 60 60">
          {/* Head */}
          <circle cx="30" cy="30" r="26" fill={colourPrimary} />
          {/* Facial disc */}
          <ellipse cx="30" cy="32" rx="20" ry="18" fill={colourSecondary} opacity="0.5" />
          {/* Ear tufts */}
          <polygon points="16,10 12,0 20,8" fill={colourPrimary} />
          <polygon points="44,10 48,0 40,8" fill={colourPrimary} />
          {/* Eyes */}
          {!eyesClosed ? (
            <>
              <circle cx="22" cy="28" r="8" fill="#f0a030" />
              <circle cx="38" cy="28" r="8" fill="#f0a030" />
              {/* Amber glow */}
              <circle cx="22" cy="28" r="8" fill="#f0a030" opacity="0.4" filter="url(#owlGlow)" />
              <circle cx="38" cy="28" r="8" fill="#f0a030" opacity="0.4" filter="url(#owlGlow)" />
              <circle cx="22" cy="28" r="5" fill="#1a0a00" />
              <circle cx="38" cy="28" r="5" fill="#1a0a00" />
              <circle cx="20" cy="26" r="1.5" fill="white" opacity="0.8" />
              <circle cx="36" cy="26" r="1.5" fill="white" opacity="0.8" />
            </>
          ) : (
            <>
              <path d="M14 28 Q22 24 30 28" stroke={colourPrimary} strokeWidth="2" fill="none" />
              <path d="M30 28 Q38 24 46 28" stroke={colourPrimary} strokeWidth="2" fill="none" />
            </>
          )}
          {/* Beak */}
          <polygon points="30,36 26,42 34,42" fill="#c8901a" />
          <defs>
            <filter id="owlGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
            </filter>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

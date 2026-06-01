'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiddenObject as HiddenObjectType } from '@/types';

interface HiddenObjectProps {
  hiddenObject: HiddenObjectType;
}

export default function HiddenObject({ hiddenObject }: HiddenObjectProps) {
  const [found, setFound] = useState(hiddenObject.is_found);
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const x = hiddenObject.position_x * 100;
  const y = hiddenObject.position_y * 100;

  const isTreasure = hiddenObject.object_type === 'treasure_chest';

  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
      <motion.div
        className="cursor-pointer relative"
        animate={found ? {} : { scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => {
          if (!found) {
            setFound(true);
            setRevealed(true);
            setTimeout(() => setRevealed(false), 4000);
          } else {
            setShowHint(h => !h);
          }
        }}
        whileHover={{ scale: 1.1 }}
        title={found ? hiddenObject.hint_text : 'Something is hidden here...'}
      >
        {/* Glow pulse (only before found) */}
        {!found && (
          <motion.div
            className="absolute rounded-full"
            style={{ inset: -8, background: 'radial-gradient(circle, rgba(255,220,80,0.2) 0%, transparent 70%)' }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        )}

        {isTreasure ? (
          <svg width="52" height="42" viewBox="0 0 52 42">
            {/* Chest body */}
            <rect x="4" y="18" width="44" height="24" rx="2" fill={found ? '#c8a030' : '#6a4a10'} />
            {/* Lid */}
            <motion.path
              d="M4,18 Q4,4 26,4 Q48,4 48,18 Z"
              fill={found ? '#d8b040' : '#7a5a18'}
              animate={found ? { d: 'M4,18 Q4,-6 26,-12 Q48,-6 48,18 Z' } : undefined}
              transition={{ duration: 0.4 }}
            />
            {/* Latch */}
            <rect x="22" y="16" width="8" height="8" rx="4" fill={found ? '#f0e060' : '#3a2a08'} />
            {/* Bands */}
            <line x1="4" y1="30" x2="48" y2="30" stroke={found ? '#b89020' : '#4a3008'} strokeWidth="2" />
            {/* Sparkles when just found */}
            {revealed && (
              <>
                <circle cx="10" cy="5" r="2" fill="#ffe060" />
                <circle cx="40" cy="2" r="3" fill="#ffe060" />
                <circle cx="26" cy="-4" r="2" fill="#ffffff" />
              </>
            )}
          </svg>
        ) : (
          /* Riddle stone */
          <svg width="48" height="50" viewBox="0 0 48 50">
            <ellipse cx="24" cy="35" rx="20" ry="15" fill={found ? '#8a6a3a' : '#3a3a3a'} />
            <ellipse cx="24" cy="28" rx="18" ry="20" fill={found ? '#9a7a4a' : '#4a4a4a'} />
            {/* Rune marks */}
            <text x="24" y="32" textAnchor="middle" fontSize="12" fill={found ? '#ffd070' : '#666'} fontFamily="serif">
              {found ? '★' : '?'}
            </text>
          </svg>
        )}
      </motion.div>

      {/* Revealed description popup */}
      <AnimatePresence>
        {(showHint || revealed) && (
          <motion.div
            className="absolute z-50 rounded-2xl p-4 w-56 text-center shadow-2xl"
            style={{
              background: 'rgba(10,8,20,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(200,160,48,0.3)',
              boxShadow: '0 4px 40px rgba(200,160,48,0.2)',
              bottom: '110%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
          >
            <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">
              {found ? 'Found!' : 'Hidden Object'}
            </p>
            <p className="text-white/90 text-sm leading-relaxed">
              {found ? hiddenObject.description : hiddenObject.hint_text}
            </p>
            {(showHint && !revealed) && (
              <button
                className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowHint(false); }}
              >
                close
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reminder } from '@/types';

interface ReminderOrbProps {
  reminder: Reminder;
}

export default function ReminderOrb({ reminder }: ReminderOrbProps) {
  const [expanded, setExpanded] = useState(false);

  const x = 30 + Math.abs(reminder.id.charCodeAt(0)) % 40;
  const y = 20 + Math.abs(reminder.id.charCodeAt(1)) % 50;

  if (reminder.is_completed) return null;

  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <motion.div
        className="cursor-pointer relative"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => setExpanded(e => !e)}
        whileHover={{ scale: 1.15 }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 56,
            height: 56,
            top: -4,
            left: -4,
            background: `radial-gradient(circle, ${reminder.orb_colour}44 0%, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Orb body */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            background: `radial-gradient(circle at 35% 35%, ${reminder.orb_colour}ee, ${reminder.orb_colour}88)`,
            boxShadow: `0 0 20px ${reminder.orb_colour}88, inset 0 0 10px rgba(255,255,255,0.2)`,
          }}
        >
          {/* Highlight */}
          <div
            className="rounded-full"
            style={{ width: 14, height: 14, background: 'rgba(255,255,255,0.3)', position: 'absolute', top: 8, left: 10 }}
          />
          {/* Bell icon or clock */}
          <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}>🔮</span>
        </div>
      </motion.div>

      {/* Expanded reminder message */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute z-50 rounded-2xl p-4 w-56 text-center shadow-2xl"
            style={{
              background: 'rgba(10,8,20,0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${reminder.orb_colour}44`,
              boxShadow: `0 4px 40px ${reminder.orb_colour}33`,
              bottom: '110%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
          >
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Reminder</p>
            <p className="text-white/90 text-sm leading-relaxed" style={{ fontFamily: "'Caveat', cursive" }}>
              {reminder.message_text}
            </p>
            {reminder.remind_at && (
              <p className="text-xs text-white/30 mt-2">
                {new Date(reminder.remind_at).toLocaleDateString()}
              </p>
            )}
            <button
              className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            >
              close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

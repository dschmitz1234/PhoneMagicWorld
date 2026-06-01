'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Creature } from '@/types';

interface CreatureTooltipProps {
  creature: Creature | null;
  onClose: () => void;
}

export default function CreatureTooltip({ creature, onClose }: CreatureTooltipProps) {
  return (
    <AnimatePresence>
      {creature && (
        <>
          {/* Backdrop click to close */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{
              left: '50%',
              top: '30%',
              translateX: '-50%',
              translateY: '-50%',
            }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div
              className="rounded-2xl px-6 py-5 max-w-xs text-center pointer-events-auto"
              style={{
                background: 'rgba(10, 8, 20, 0.88)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${creature.colour_primary}44`,
                boxShadow: `0 4px 40px ${creature.colour_primary}33`,
              }}
            >
              {/* Creature colour dot */}
              <div
                className="w-3 h-3 rounded-full mx-auto mb-3"
                style={{ background: creature.colour_primary, boxShadow: `0 0 8px ${creature.colour_primary}` }}
              />
              <h3
                className="text-white text-lg font-semibold mb-1"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {creature.name}
              </h3>
              <p
                className="text-purple-200 text-xs italic leading-relaxed"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {creature.special_ability}
              </p>
              {creature.personality && (
                <p
                  className="text-gray-400 text-xs mt-2 leading-relaxed"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {creature.personality}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

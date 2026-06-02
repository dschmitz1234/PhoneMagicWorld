'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceMemo } from '@/types';
import { getServiceClient } from '@/lib/supabase';

interface VoiceMemoOrbProps {
  memo: VoiceMemo;
}

// Amber colour palette for voice memo orbs
const ORB_COLOUR = '#f59e0b';
const ORB_COLOUR_DARK = '#b45309';

export default function VoiceMemoOrb({ memo }: VoiceMemoOrbProps) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [listened, setListened] = useState(memo.is_listened);
  const [progress, setProgress] = useState(0); // 0–1
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const updateProgress = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration) setProgress(audio.currentTime / audio.duration);
    if (!audio.paused) rafRef.current = requestAnimationFrame(updateProgress);
  };

  const handleTogglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    } else {
      try {
        await audio.play();
        setPlaying(true);
        rafRef.current = requestAnimationFrame(updateProgress);

        // Mark as listened in DB (best-effort, no blocking)
        if (!listened) {
          setListened(true);
          const db = getServiceClient();
          db.from('voice_memos').update({
            is_listened: true,
            listened_at: new Date().toISOString(),
          }).eq('id', memo.id).then(({ error }) => {
            if (error) console.warn('[VoiceMemoOrb] Failed to mark listened:', error);
          });
        }
      } catch (err) {
        console.error('[VoiceMemoOrb] Playback error:', err);
        setPlaying(false);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlaying(false);
    setProgress(1);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  };

  const formattedDuration = memo.duration_seconds
    ? `${Math.floor(memo.duration_seconds / 60)}:${String(memo.duration_seconds % 60).padStart(2, '0')}`
    : null;

  const formattedDate = new Date(memo.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const senderLabel = memo.sender_display_name ?? 'A magic caller';

  return (
    <div
      className="absolute"
      style={{
        left: `${memo.position_x}%`,
        top: `${memo.position_y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 40,
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={memo.audio_url}
        onEnded={handleAudioEnded}
        preload="none"
      />

      {/* Orb button */}
      <motion.div
        className="cursor-pointer relative"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: (memo.position_x % 2) * 1.5,
        }}
        onClick={() => setExpanded((e) => !e)}
        whileHover={{ scale: 1.15 }}
      >
        {/* Outer glow ring — pulses faster when unlistened */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 60,
            height: 60,
            top: -6,
            left: -6,
            background: `radial-gradient(circle, ${ORB_COLOUR}55 0%, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{
            duration: listened ? 3.5 : 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Orb body */}
        <div
          className="rounded-full flex items-center justify-center relative"
          style={{
            width: 48,
            height: 48,
            background: `radial-gradient(circle at 35% 35%, ${ORB_COLOUR}ee, ${ORB_COLOUR_DARK}99)`,
            boxShadow: `0 0 22px ${ORB_COLOUR}99, inset 0 0 12px rgba(255,255,255,0.15)`,
            opacity: listened ? 0.75 : 1,
          }}
        >
          {/* Highlight */}
          <div
            className="rounded-full absolute"
            style={{ width: 14, height: 14, background: 'rgba(255,255,255,0.3)', top: 7, left: 9 }}
          />
          {/* Mic icon */}
          <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}>
            {'\uD83C\uDFA4'}
          </span>
        </div>

        {/* Unlistened indicator dot */}
        {!listened && (
          <div
            className="absolute rounded-full"
            style={{
              width: 10,
              height: 10,
              background: '#ef4444',
              border: '2px solid rgba(0,0,0,0.6)',
              top: -2,
              right: -2,
            }}
          />
        )}
      </motion.div>

      {/* Expanded player card */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute z-50 rounded-2xl p-4 shadow-2xl"
            style={{
              width: 220,
              background: 'rgba(10,8,20,0.93)',
              backdropFilter: 'blur(18px)',
              border: `1px solid ${ORB_COLOUR}44`,
              boxShadow: `0 4px 40px ${ORB_COLOUR}33`,
              bottom: '115%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-amber-400/80 font-medium truncate">
                {senderLabel}
              </p>
              <button
                className="text-white/30 hover:text-white/70 transition-colors ml-2 text-lg leading-none"
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                aria-label="Close"
              >
                {'\u00D7'}
              </button>
            </div>

            {/* Progress bar */}
            <div
              className="w-full rounded-full overflow-hidden mb-3"
              style={{ height: 6, background: 'rgba(255,255,255,0.1)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: ORB_COLOUR }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              <button
                className="rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                style={{
                  width: 40,
                  height: 40,
                  background: playing
                    ? `rgba(245,158,11,0.2)`
                    : `radial-gradient(circle at 35% 35%, ${ORB_COLOUR}dd, ${ORB_COLOUR_DARK}99)`,
                  border: `1px solid ${ORB_COLOUR}55`,
                  boxShadow: playing ? 'none' : `0 0 12px ${ORB_COLOUR}55`,
                }}
                onClick={handleTogglePlay}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  // Pause icon — two bars
                  <svg width="14" height="14" viewBox="0 0 14 14" fill={ORB_COLOUR}>
                    <rect x="2" y="1" width="4" height="12" rx="1" />
                    <rect x="8" y="1" width="4" height="12" rx="1" />
                  </svg>
                ) : (
                  // Play icon
                  <svg width="14" height="14" viewBox="0 0 14 14" fill={ORB_COLOUR}>
                    <polygon points="3,1 13,7 3,13" />
                  </svg>
                )}
              </button>

              {/* Duration + date */}
              <div className="text-right">
                {formattedDuration && (
                  <p className="text-amber-300/80 text-xs">{formattedDuration}</p>
                )}
                <p className="text-white/30 text-xs">{formattedDate}</p>
              </div>
            </div>

            {/* CSS waveform animation (visible when playing) */}
            {playing && (
              <div className="flex items-end justify-center gap-0.5 mt-3" style={{ height: 20 }}>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{ width: 3, background: ORB_COLOUR, opacity: 0.7 }}
                    animate={{ height: ['4px', `${8 + Math.random() * 10}px`, '4px'] }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.06,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Transcript (if available) */}
            {memo.transcript && (
              <p
                className="text-white/50 text-xs mt-3 leading-relaxed line-clamp-3"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                {memo.transcript}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

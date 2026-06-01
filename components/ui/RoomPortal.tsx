'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RoomSlug } from '@/types';

const ROOMS: { slug: RoomSlug; name: string; colour: string; particleColour: string; description: string }[] = [
  { slug: 'forest', name: 'The Forest Room', colour: '#4a7c59', particleColour: '#ffe066', description: 'Ancient woodland where creatures dwell' },
  { slug: 'ocean', name: 'The Ocean Room', colour: '#0077aa', particleColour: '#a0f0ff', description: 'Deep underwater world full of light' },
  { slug: 'space', name: 'The Space Room', colour: '#2d0a4a', particleColour: '#c0a0ff', description: 'A cosmic void of nebulae and stars' },
  { slug: 'castle', name: 'The Castle Room', colour: '#3a2a1a', particleColour: '#ff8820', description: 'Stone halls lit by flickering torches' },
];

// Deterministic star field — computed once at module level to avoid SSR/client hydration mismatch
const STARS = Array.from({ length: 80 }, (_, i) => ({
  width: (i * 17 + 7) % 10 < 7 ? 1 : 2,
  height: (i * 17 + 7) % 10 < 7 ? 1 : 2,
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 19) % 100}%`,
  duration: 1 + ((i * 23 + 3) % 30) / 10,
  delay: ((i * 41 + 7) % 40) / 10,
}));

export default function WorldHub() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-12 px-6"
      style={{ background: 'linear-gradient(180deg, #04010d 0%, #0d0820 50%, #04010d 100%)' }}
    >
      {/* Star field background */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((star, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: star.width,
              height: star.height,
              left: star.left,
              top: star.top,
            }}
            animate={{ opacity: [0.1, 1, 0.1] }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.h1
        className="text-white text-3xl mb-12 tracking-widest text-center"
        style={{ fontFamily: "'Cinzel Decorative', serif" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Choose Your Room
      </motion.h1>

      {/* Portal grid */}
      <div className="relative z-10 grid grid-cols-2 gap-6 w-full max-w-2xl">
        {ROOMS.map((room, i) => (
          <motion.div
            key={room.slug}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
          >
            <Link href={`/world/${room.slug}`}>
              <motion.div
                className="relative rounded-2xl overflow-hidden cursor-pointer p-6 flex flex-col items-center gap-3"
                style={{
                  background: `linear-gradient(135deg, ${room.colour}22, ${room.colour}44)`,
                  border: `1px solid ${room.colour}66`,
                  boxShadow: `0 0 20px ${room.colour}22`,
                }}
                whileHover={{
                  scale: 1.04,
                  boxShadow: `0 0 40px ${room.colour}55`,
                  border: `1px solid ${room.colour}cc`,
                }}
                transition={{ duration: 0.25 }}
              >
                {/* Portal arch shape */}
                <div
                  className="w-full h-28 rounded-t-full rounded-b-none mb-2"
                  style={{
                    background: `radial-gradient(ellipse at center top, ${room.colour}44, ${room.colour}11)`,
                    border: `1px solid ${room.colour}44`,
                    borderBottom: 'none',
                  }}
                />

                <h2
                  className="text-white text-base font-semibold tracking-wide text-center"
                  style={{ fontFamily: "'Cinzel Decorative', serif" }}
                >
                  {room.name}
                </h2>
                <p
                  className="text-xs text-center opacity-60"
                  style={{ color: room.particleColour, fontFamily: "'Lora', serif" }}
                >
                  {room.description}
                </p>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

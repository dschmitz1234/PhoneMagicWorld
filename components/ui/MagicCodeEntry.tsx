'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function MagicCodeEntry() {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleChange = (index: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = char;
    setCode(next);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (char && index === 5) {
      const full = [...next].join('');
      if (full.length === 6) submitCode(full);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (magicCode: string) => {
    setIsLoading(true);
    setIsError(false);

    try {
      const res = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: magicCode }),
      });

      if (res.ok) {
        router.push('/world');
      } else {
        setIsError(true);
        setCode(Array(6).fill(''));
        setTimeout(() => {
          setIsError(false);
          inputRefs.current[0]?.focus();
        }, 800);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Deep twilight background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0d0d2b 0%, #1a1040 50%, #2d1a50 100%)',
        }}
      />

      {/* Aurora blobs */}
      {[
        { colour: 'rgba(74, 124, 89, 0.15)', delay: 0, duration: 22 },
        { colour: 'rgba(0, 77, 110, 0.15)', delay: 7, duration: 28 },
        { colour: 'rgba(74, 0, 100, 0.15)', delay: 14, duration: 25 },
      ].map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 500,
            height: 500,
            background: `radial-gradient(circle, ${blob.colour}, transparent 70%)`,
            filter: 'blur(80px)',
            left: `${20 + i * 25}%`,
            top: `${10 + i * 20}%`,
          }}
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -40, 60, 0],
          }}
          transition={{
            duration: blob.duration,
            delay: blob.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Frosted glass card */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 rounded-3xl p-12"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Title */}
        <div className="text-center">
          <h1
            className="text-4xl text-white mb-2"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            The Magical World
          </h1>
          <p
            className="text-purple-200 italic text-lg"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Enter your magic code
          </p>
        </div>

        {/* Code boxes */}
        <motion.div
          className="flex gap-3"
          animate={
            isError
              ? { x: [0, -8, 8, -5, 5, 0] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          {code.map((char, i) => (
            <motion.input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              className="w-12 h-14 text-center text-xl font-bold text-white rounded-xl outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: isError
                  ? '2px solid rgba(255, 80, 80, 0.8)'
                  : char
                  ? '2px solid rgba(192, 160, 255, 0.8)'
                  : focusedIndex === i
                  ? '2px solid rgba(192, 160, 255, 0.6)'
                  : '2px solid rgba(255,255,255,0.15)',
                boxShadow: isError
                  ? '0 0 12px rgba(255,80,80,0.4)'
                  : char
                  ? '0 0 12px rgba(192,160,255,0.4)'
                  : 'none',
                fontFamily: "'Lora', serif",
              }}
              initial={false}
              animate={char ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.15 }}
              disabled={isLoading}
            />
          ))}
        </motion.div>

        {/* Loading shimmer */}
        <AnimatePresence>
          {isLoading && (
            <motion.p
              className="text-purple-300 text-sm italic"
              style={{ fontFamily: "'Lora', serif" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Opening the gate...
            </motion.p>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {isError && !isLoading && (
            <motion.p
              className="text-red-300 text-sm italic"
              style={{ fontFamily: "'Lora', serif" }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              That code doesn&apos;t seem right. Try again.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

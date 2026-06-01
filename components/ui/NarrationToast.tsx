'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NarrationToastProps {
  narration: string;
  realWorldPrompt?: string;
  onDismiss: () => void;
}

export default function NarrationToast({
  narration,
  realWorldPrompt,
  onDismiss,
}: NarrationToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 z-50 max-w-sm w-full px-4"
      style={{ translateX: '-50%' }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div
        className="rounded-2xl px-5 py-4 text-center"
        style={{
          background: 'rgba(10, 8, 20, 0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
        }}
      >
        <p
          className="text-white italic text-sm leading-relaxed"
          style={{ fontFamily: "'Lora', serif" }}
        >
          {narration}
        </p>
        {realWorldPrompt && (
          <p
            className="mt-2 text-purple-300 text-xs italic"
            style={{ fontFamily: "'Lora', serif" }}
          >
            {realWorldPrompt}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Container that manages a queue of toasts
interface ToastItem {
  id: string;
  narration: string;
  realWorldPrompt?: string;
}

interface NarrationToastQueueProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function NarrationToastQueue({ toasts, onDismiss }: NarrationToastQueueProps) {
  return (
    <AnimatePresence mode="wait">
      {toasts.slice(0, 1).map((toast) => (
        <NarrationToast
          key={toast.id}
          narration={toast.narration}
          realWorldPrompt={toast.realWorldPrompt}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </AnimatePresence>
  );
}

'use client';

/**
 * MagicOracle — floating chat button available in every room.
 * Opens a drawer where the child can type or speak a question.
 * The AI narrator responds in streaming text, then optionally reads
 * the reply aloud via the browser's Web Speech API.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MagicOracleProps {
  room: 'forest' | 'ocean' | 'space' | 'castle';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Minimal type for the SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  start(): void;
  stop(): void;
}
const ROOM_STYLES: Record<string, { accent: string; glow: string; icon: string; title: string }> = {
  forest: { accent: '#4a7c59', glow: '#ffe066', icon: '\u{1F98A}', title: 'Ask the Forest' },
  ocean:  { accent: '#0077aa', glow: '#a0f0ff', icon: '\u{1FAC1}', title: 'Ask the Deep' },
  space:  { accent: '#2d0a4a', glow: '#c0a0ff', icon: '\u2728', title: 'Ask the Stars' },
  castle: { accent: '#3a2a1a', glow: '#ff8820', icon: '\u{1F989}', title: 'Ask the Oracle' },
};

export default function MagicOracle({ room }: MagicOracleProps) {
  const [open, setOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const style = ROOM_STYLES[room];

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stop TTS when drawer closes
  useEffect(() => {
    if (!open && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
  }, [open]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      /Google UK English Female|Samantha|Karen|Moira/i.test(v.name)
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    const assistantId = crypto.randomUUID();
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), room, history }),
      });
      if (!res.ok || !res.body) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullReply += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullReply } : m))
        );
      }
      speak(fullReply);
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'The magical world is quiet right now. Try again in a moment.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, room, speak]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as Record<string, unknown>;
    const SR = (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as (new () => ISpeechRecognition) | undefined;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-GB';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="absolute bottom-6 right-6 z-50 flex items-center justify-center rounded-full text-2xl shadow-lg"
        style={{
          width: 56, height: 56,
          background: style.accent,
          boxShadow: `0 0 20px ${style.glow}88`,
          border: `2px solid ${style.glow}66`,
        }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        title={style.title}
      >
        {style.icon}
      </motion.button>

      {/* Chat drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="oracle-drawer"
            className="absolute bottom-20 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: 340, maxHeight: 480,
              background: 'rgba(4,1,13,0.92)',
              border: `1px solid ${style.glow}44`,
              boxShadow: `0 0 40px ${style.glow}33`,
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: style.accent + 'cc', borderBottom: `1px solid ${style.glow}33` }}>
              <span className="text-white text-sm font-semibold tracking-wide" style={{ fontFamily: 'var(--font-cinzel)' }}>
                {style.icon} {style.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTtsEnabled((v) => !v)}
                  className="text-xs px-2 py-1 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                  style={{ background: ttsEnabled ? style.glow + '44' : '#ffffff22', color: '#fff' }}
                  title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
                >{ttsEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07'}</button>
                <button onClick={() => setOpen(false)} className="text-white opacity-50 hover:opacity-100 text-lg leading-none">&times;</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ minHeight: 200, maxHeight: 320 }}>
              {messages.length === 0 && (
                <p className="text-center text-sm opacity-40 mt-8" style={{ color: style.glow }}>
                  Ask anything about this magical world…
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span
                    className="inline-block px-3 py-2 rounded-xl max-w-[90%]"
                    style={msg.role === 'user'
                      ? { background: style.accent + 'cc', color: '#fff' }
                      : { background: '#ffffff11', color: style.glow, border: `1px solid ${style.glow}33` }}
                  >
                    {msg.content || <span className="animate-pulse">✦ ✦ ✦</span>}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2 px-3 py-3"
              style={{ borderTop: `1px solid ${style.glow}22` }}
            >
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className="flex-shrink-0 rounded-full flex items-center justify-center text-base transition-all"
                style={{
                  width: 36, height: 36,
                  background: listening ? '#ff4444' : style.accent + '99',
                  boxShadow: listening ? '0 0 12px #ff4444' : 'none',
                }}
                title={listening ? 'Stop listening' : 'Speak your question'}
              >{'🎤'}</button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:opacity-30"
                style={{ minWidth: 0 }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 rounded-full flex items-center justify-center text-base transition-all disabled:opacity-30"
                style={{ width: 36, height: 36, background: style.glow + 'cc' }}
              >{'➤'}</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

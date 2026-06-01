'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { Howl } from 'howler';

interface RoomShellProps {
  children: ReactNode;
  audioSrc: string;
  volume?: number;
}

export default function RoomShell({ children, audioSrc, volume = 0.25 }: RoomShellProps) {
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    const sound = new Howl({
      src: [audioSrc],
      loop: true,
      volume: 0,
      autoplay: true,
    });

    howlRef.current = sound;

    // Fade in over 3s
    sound.once('play', () => {
      sound.fade(0, volume, 3000);
    });

    return () => {
      // Fade out over 3s then stop
      sound.fade(volume, 0, 3000);
      setTimeout(() => sound.unload(), 3100);
    };
  }, [audioSrc, volume]);

  return <div className="relative w-full h-full">{children}</div>;
}

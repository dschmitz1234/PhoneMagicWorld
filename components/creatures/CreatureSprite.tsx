'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Creature, CreatureType } from '@/types';
import { ANIMATION } from '@/lib/animations';
import GlowingFox from './GlowingFox';
import MoonJellyfish from './MoonJellyfish';
import StarDragonfly from './StarDragonfly';
import StoneOwl from './StoneOwl';
import MossRabbit from './MossRabbit';
import CloudWhale from './CloudWhale';
import EmberMoth from './EmberMoth';
import TideTurtle from './TideTurtle';

interface CreatureSpriteProps {
  creature: Creature;
  roomBounds: { width: number; height: number };
  onCreatureClick: (creature: Creature) => void;
}

function CreatureBody({
  type,
  colourPrimary,
  colourSecondary,
  scaleX,
}: {
  type: CreatureType;
  colourPrimary: string;
  colourSecondary: string;
  scaleX: number;
}) {
  switch (type) {
    case 'glowing_fox':
      return <GlowingFox colourPrimary={colourPrimary} colourSecondary={colourSecondary} scaleX={scaleX} />;
    case 'moon_jellyfish':
      return <MoonJellyfish colourPrimary={colourPrimary} colourSecondary={colourSecondary} />;
    case 'star_dragonfly':
      return <StarDragonfly colourPrimary={colourPrimary} colourSecondary={colourSecondary} />;
    case 'stone_owl':
      return <StoneOwl colourPrimary={colourPrimary} colourSecondary={colourSecondary} />;
    case 'moss_rabbit':
      return <MossRabbit colourPrimary={colourPrimary} colourSecondary={colourSecondary} />;
    case 'cloud_whale':
      return <CloudWhale colourPrimary={colourPrimary} colourSecondary={colourSecondary} />;
    case 'ember_moth':
      return <EmberMoth colourPrimary={colourPrimary} colourSecondary={colourSecondary} />;
    case 'tide_turtle':
      return <TideTurtle colourPrimary={colourPrimary} colourSecondary={colourSecondary} />;
    default:
      return (
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="30" fill={colourPrimary} opacity="0.9" />
          <circle cx="40" cy="40" r="20" fill={colourSecondary} opacity="0.5" />
        </svg>
      );
  }
}

export default function CreatureSprite({
  creature,
  roomBounds,
  onCreatureClick,
}: CreatureSpriteProps) {
  const waypointIndex = useRef(0);
  const [position, setPosition] = useState({
    x: (creature.position_x / 100) * roomBounds.width,
    y: (creature.position_y / 100) * roomBounds.height,
  });
  const [isWandering, setIsWandering] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const waypoints = creature.wander_path;

  const advanceWaypoint = useCallback(() => {
    if (!waypoints || waypoints.length === 0) return;

    const nextIndex = (waypointIndex.current + 1) % waypoints.length;
    waypointIndex.current = nextIndex;
    const wp = waypoints[nextIndex];

    const newX = (wp.x / 100) * roomBounds.width;
    const newY = (wp.y / 100) * roomBounds.height;

    setFacingRight(newX > position.x);
    setPosition({ x: newX, y: newY });
    setIsWandering(true);
  }, [waypoints, roomBounds, position.x]);

  const handleAnimationComplete = useCallback(() => {
    setIsWandering(false);
    const wp = waypoints?.[waypointIndex.current];
    const pauseDuration = (wp?.pause ?? 2) * 1000;

    pauseTimerRef.current = setTimeout(advanceWaypoint, pauseDuration);
  }, [waypoints, advanceWaypoint]);

  useEffect(() => {
    // Start wandering after arrival animation
    const timer = setTimeout(() => {
      setHasArrived(true);
      pauseTimerRef.current = setTimeout(advanceWaypoint, 1000);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasGlow = creature.special_ability.toLowerCase().includes('glow');

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{ left: 0, top: 0 }}
      initial={{ opacity: 0, scale: 0.6, filter: 'blur(8px)', x: position.x, y: position.y }}
      animate={{
        opacity: 1,
        scale: hasArrived ? 1 : 1,
        filter: 'blur(0px)',
        x: position.x,
        y: position.y,
      }}
      transition={
        isWandering
          ? {
              x: { duration: waypoints?.[waypointIndex.current]?.duration ?? 8, ease: 'easeInOut' },
              y: { duration: waypoints?.[waypointIndex.current]?.duration ?? 8, ease: 'easeInOut' },
              opacity: { duration: 1.8 },
              scale: { duration: 1.8 },
              filter: { duration: 1.8 },
            }
          : { opacity: { duration: 1.8 }, scale: { duration: 1.8 }, filter: { duration: 1.8 } }
      }
      onAnimationComplete={isWandering ? handleAnimationComplete : undefined}
      onClick={() => {
        onCreatureClick(creature);
        // Pause wander for 3s
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        setTimeout(advanceWaypoint, 3000);
      }}
      whileTap={{ scale: [1, 1.15, 1] }}
    >
      {/* Ground shadow */}
      <div
        className="absolute bottom-0 left-1/2 pointer-events-none"
        style={{
          width: 72,
          height: 16,
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)',
        }}
      />

      {/* Breathing wrapper */}
      <motion.div
        animate={!isWandering ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={
          !isWandering
            ? ANIMATION.BREATHE.transition
            : { duration: 0.3 }
        }
        style={{
          filter: hasGlow
            ? `drop-shadow(0 0 8px ${creature.colour_primary})`
            : undefined,
        }}
      >
        <CreatureBody
          type={creature.creature_type}
          colourPrimary={creature.colour_primary}
          colourSecondary={creature.colour_secondary}
          scaleX={facingRight ? 1 : -1}
        />
      </motion.div>
    </motion.div>
  );
}

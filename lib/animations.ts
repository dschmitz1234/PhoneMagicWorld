// ============================================================
// GLOBAL ANIMATION CONSTANTS
// Use these values consistently across all rooms and creatures
// ============================================================

export const ANIMATION = {
  // Creature breathing — gentle scale pulse
  BREATHE: {
    scale: [1, 1.03, 1] as number[],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  },

  // Floating up/down — for letters, orbs, jellyfish
  FLOAT: {
    y: [0, -12, 0] as number[],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },

  // Slow spin — for orbiting objects
  SPIN_SLOW: {
    rotate: [0, 360] as number[],
    transition: { duration: 20, repeat: Infinity, ease: 'linear' },
  },

  // Gentle sway — for kelp, trees, banners
  SWAY: {
    rotate: [-2, 2, -2] as number[],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },

  // Creature wander speed — seconds for a full cross-room move
  WANDER_BASE_DURATION: 8,

  // Arrival animation
  ARRIVE: {
    initial: { opacity: 0, scale: 0.6, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { duration: 1.8, ease: [0.34, 1.56, 0.64, 1] },
  },

  // Click/tap response
  TAP: {
    scale: [1, 1.15, 1] as number[],
    transition: { duration: 0.4, ease: 'easeOut' },
  },
} as const;

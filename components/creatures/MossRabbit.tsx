'use client';

import { motion } from 'framer-motion';

interface MossRabbitProps {
  colourPrimary: string;
  colourSecondary: string;
}

export default function MossRabbit({ colourPrimary, colourSecondary }: MossRabbitProps) {
  return (
    <div className="relative" style={{ width: 70, height: 90 }}>
      <svg width={70} height={90} viewBox="0 0 70 90">
        {/* Long ears */}
        <motion.g
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '25px 30px' }}
        >
          <ellipse cx="25" cy="22" rx="8" ry="22" fill={colourPrimary} />
          <ellipse cx="25" cy="22" rx="4" ry="17" fill={colourSecondary} opacity="0.7" />
        </motion.g>
        <motion.g
          animate={{ rotate: [3, -3, 3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          style={{ transformOrigin: '45px 30px' }}
        >
          <ellipse cx="45" cy="22" rx="8" ry="22" fill={colourPrimary} />
          <ellipse cx="45" cy="22" rx="4" ry="17" fill={colourSecondary} opacity="0.7" />
        </motion.g>

        {/* Body */}
        <ellipse cx="35" cy="65" rx="24" ry="22" fill={colourPrimary} />
        {/* Belly */}
        <ellipse cx="35" cy="68" rx="15" ry="14" fill={colourSecondary} opacity="0.6" />

        {/* Head */}
        <circle cx="35" cy="42" r="18" fill={colourPrimary} />
        {/* Cheek moss patches */}
        <circle cx="24" cy="46" r="5" fill="#3a7a20" opacity="0.4" />
        <circle cx="46" cy="46" r="5" fill="#3a7a20" opacity="0.4" />

        {/* Eyes */}
        <circle cx="28" cy="40" r="4" fill="#1a3a10" />
        <circle cx="42" cy="40" r="4" fill="#1a3a10" />
        <circle cx="27" cy="39" r="1.5" fill="white" opacity="0.8" />
        <circle cx="41" cy="39" r="1.5" fill="white" opacity="0.8" />

        {/* Nose */}
        <motion.ellipse
          cx="35"
          cy="48"
          rx="3"
          ry="2"
          fill="#e87a8a"
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
        />

        {/* Feet */}
        <ellipse cx="22" cy="85" rx="10" ry="5" fill={colourPrimary} />
        <ellipse cx="48" cy="85" rx="10" ry="5" fill={colourPrimary} />

        {/* Tail */}
        <circle cx="58" cy="68" r="7" fill={colourSecondary} />
      </svg>
    </div>
  );
}

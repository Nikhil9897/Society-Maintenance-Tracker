import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'drawing' | 'reveal' | 'done'>('drawing');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1000);
    const t2 = setTimeout(() => { setPhase('done'); onComplete(); }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
        >
          {/* Blueprint floor plan SVG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          >
            <BlueprintLoader />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            className="mt-8 flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          >
            <span className="font-display text-2xl text-parchment tracking-tight" style={{ fontVariationSettings: '"SOFT" 50' }}>
              SocioSphere
            </span>
            <span className="text-xs text-slate font-mono tracking-widest uppercase">Loading</span>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-px bg-brass"
            initial={{ width: '0%' }}
            animate={{ width: '100%', transition: { duration: 1.4, ease: 'linear' } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const BlueprintLoader: React.FC = () => (
  <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer walls */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '540', '--delay': '0ms' } as React.CSSProperties}
      d="M10 10 L150 10 L150 110 L10 110 Z"
      strokeWidth="1.5"
    />
    {/* Interior wall horizontal */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '140', '--delay': '200ms' } as React.CSSProperties}
      d="M10 60 L95 60"
      strokeWidth="0.75"
    />
    {/* Interior wall vertical */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '100', '--delay': '280ms' } as React.CSSProperties}
      d="M95 10 L95 110"
      strokeWidth="0.75"
    />
    {/* Interior wall short */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '50', '--delay': '350ms' } as React.CSSProperties}
      d="M55 60 L55 110"
      strokeWidth="0.75"
    />
    {/* Door arc top-left room */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '40', '--delay': '420ms' } as React.CSSProperties}
      d="M35 60 Q35 48 47 48"
      strokeWidth="0.75"
    />
    {/* Door line */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '12', '--delay': '480ms' } as React.CSSProperties}
      d="M35 60 L47 60"
      strokeWidth="0.5"
      strokeDasharray="2 2"
    />
    {/* Stairwell lines right room */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '200', '--delay': '520ms' } as React.CSSProperties}
      d="M105 70 L145 70 M105 78 L145 78 M105 86 L145 86 M105 94 L145 94"
      strokeWidth="0.5"
    />
    {/* Window marks top wall */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '60', '--delay': '580ms' } as React.CSSProperties}
      d="M30 10 L30 6 M60 10 L60 6 M110 10 L110 6 M130 10 L130 6"
      strokeWidth="0.75"
    />
    {/* Compass rose hint */}
    <path
      className="bp-path bp-animated"
      style={{ '--len': '30', '--delay': '640ms' } as React.CSSProperties}
      d="M135 100 L135 90 M130 95 L140 95"
      strokeWidth="0.5"
    />
  </svg>
);

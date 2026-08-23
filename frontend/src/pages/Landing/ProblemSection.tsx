import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const pains = [
  {
    stat: '73%',
    copy: 'of complaint follow-ups happen on WhatsApp — because there\'s no official channel that actually works.',
  },
  {
    stat: '40+',
    copy: 'days average time-to-resolution when there\'s no priority system, no owner, no deadline. Residents remember.',
  },
  {
    stat: '0',
    copy: 'visibility residents have into what happened after they filed a complaint. The silence is the problem.',
  },
];

export const ProblemSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });

  return (
    <section ref={ref} className="bg-parchment py-28 overflow-hidden">
      <div className="section-wrap">
        {/* Section label */}
        <motion.div
          className="flex items-center gap-3 mb-12"
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="h-px w-8 bg-brass inline-block" />
          <span className="text-xs font-mono text-brass tracking-widest uppercase">The problem</span>
        </motion.div>

        {/* Main statement */}
        <div className="max-w-2xl mb-20">
          <motion.h2
            className="font-display text-obsidian leading-[1.1]"
            style={{
              fontSize: 'clamp(1.9rem, 4vw, 3.2rem)',
              fontVariationSettings: '"SOFT" 30, "opsz" 36',
              fontStyle: 'italic',
              fontWeight: 300,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Society maintenance isn't broken because of{' '}
            <span style={{ fontStyle: 'normal', fontWeight: 700, color: '#10192E' }}>bad intentions.</span>
            {' '}It's broken because there's no system.
          </motion.h2>
        </div>

        {/* Pain points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <motion.div
              key={i}
              className="bg-white/80 border border-obsidian/10 rounded-2xl p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="font-mono font-bold text-ink block mb-4 tracking-tight"
                style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}
              >
                {p.stat}
              </span>
              <p className="text-base text-obsidian/80 leading-relaxed font-normal">{p.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

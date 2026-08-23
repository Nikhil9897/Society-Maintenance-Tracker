import React, { Suspense, lazy } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlueprintSVG } from '../../components/BlueprintSVG';

const HeroScene = lazy(() =>
  import('../../components/HeroScene').then(m => ({ default: m.HeroScene }))
);

const wordReveal: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const wordItem: Variants = {
  hidden: { y: '110%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};

const headline = [
  { text: 'Every complaint', highlight: false },
  { text: 'tracked.', highlight: true },
  { text: 'Every resident', highlight: false },
  { text: 'informed.', highlight: true },
  { text: 'Nothing falls through.', highlight: false },
];

export const HeroSection: React.FC = () => (
  <section
    className="relative min-h-screen flex items-center overflow-hidden bg-ink pt-28 pb-16 lg:py-24"
    aria-label="Hero"
  >
    {/* Subtle radial glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 65% 55% at 70% 50%, rgba(58,90,140,0.16) 0%, transparent 70%)',
      }}
    />

    {/* Blueprint motif — top right, large & faint */}
    <div className="absolute top-20 right-0 pointer-events-none hidden lg:block">
      <BlueprintSVG size={540} opacity={0.08} animated className="bp-pulse" />
    </div>

    <div className="section-wrap w-full mt-6 lg:mt-0 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      {/* Left: headline + CTAs */}
      <div className="flex flex-col gap-6 lg:gap-8 z-10">
        {/* Eyebrow */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.7, duration: 0.5 }}
        >
          <span className="h-px w-8 bg-brass inline-block" />
          <span className="text-xs font-mono text-brass tracking-widest uppercase font-medium">
            Society Management Platform
          </span>
        </motion.div>

        {/* Headline — structured layout with high clarity */}
        <motion.h1
          className="font-display text-parchment leading-[1.12] tracking-tight"
          style={{
            fontSize: 'clamp(2.4rem, 4.8vw, 4.2rem)',
            fontVariationSettings: '"SOFT" 35, "opsz" 64',
          }}
          variants={wordReveal}
          initial="hidden"
          animate="visible"
        >
          <span className="block mb-1">
            Every complaint{' '}
            <span className="italic text-brass font-normal" style={{ fontVariationSettings: '"SOFT" 55, "opsz" 64' }}>
              tracked.
            </span>
          </span>
          <span className="block mb-1">
            Every resident{' '}
            <span className="italic text-brass font-normal" style={{ fontVariationSettings: '"SOFT" 55, "opsz" 64' }}>
              informed.
            </span>
          </span>
          <span className="block text-parchment/90 font-light">
            Nothing falls through.
          </span>
        </motion.h1>

        {/* Sub-copy with crystal clear contrast */}
        <motion.p
          className="text-base sm:text-lg text-parchment/80 max-w-lg leading-relaxed font-normal"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 0.6 }}
        >
          From first complaint to final resolution — SocioSphere gives your society a
          transparent, accountable operations layer. Residents get visibility. Admins get control.
          No more chasing statuses through WhatsApp.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 pt-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.3, duration: 0.5 }}
        >
          <Link to="/login" className="btn-brass text-base px-7 py-3.5 shadow-lg shadow-brass/10">
            <span>Sign in to Portal</span>
            <ArrowRight size={16} className="ml-1" />
          </Link>
          <a href="#how-it-works" className="btn-ghost text-base px-7 py-3.5 hover:bg-white/[0.04]">
            <span>See how it works</span>
          </a>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          className="flex items-center gap-8 pt-6 border-t border-parchment/12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.5 }}
        >
          {[
            ['240+', 'Societies'],
            ['18k+', 'Complaints resolved'],
            ['99.9%', 'Uptime SLA'],
          ].map(([val, label]) => (
            <div key={label} className="space-y-0.5">
              <span className="font-mono text-xl lg:text-2xl font-bold text-parchment tracking-tight block">
                {val}
              </span>
              <span className="block text-xs font-medium text-slate tracking-wide uppercase">
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right: 3D architectural scene with expansive height */}
      <motion.div
        className="relative h-[480px] lg:h-[620px] xl:h-[680px] w-full flex items-center justify-center overflow-visible"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<div className="w-full h-full" />}>
          <HeroScene />
        </Suspense>
        {/* Blueprint overlay under 3D */}
        <div className="absolute bottom-2 right-2 pointer-events-none hidden xl:block">
          <BlueprintSVG size={160} opacity={0.12} />
        </div>
      </motion.div>
    </div>

    {/* Scroll hint */}
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3, duration: 0.5 }}
    >
      <span className="text-2xs text-slate font-mono tracking-widest uppercase">Scroll</span>
      <motion.div
        className="w-px h-8 bg-brass/30"
        animate={{ scaleY: [0, 1, 0], originY: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  </section>
);

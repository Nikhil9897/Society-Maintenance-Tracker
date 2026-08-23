import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BlueprintSVG } from '../../components/BlueprintSVG';

export const CTASection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section ref={ref} className="bg-ink py-32 relative overflow-hidden">
      {/* Faint blueprint */}
      <div className="absolute bottom-0 left-0 pointer-events-none">
        <BlueprintSVG size={400} opacity={0.06} className="bp-pulse" />
      </div>
      <div className="absolute top-0 right-0 pointer-events-none">
        <BlueprintSVG size={320} opacity={0.04} />
      </div>

      <div className="section-wrap text-center relative z-10">
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <span className="h-px w-8 bg-brass" />
          <span className="text-xs font-mono text-brass tracking-widest uppercase">Get started</span>
          <span className="h-px w-8 bg-brass" />
        </motion.div>

        <motion.h2
          className="font-display text-parchment mx-auto"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.8rem)',
            fontVariationSettings: '"SOFT" 50, "opsz" 48',
            maxWidth: '680px',
            lineHeight: 1.1,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Your society deserves more than a WhatsApp group.
        </motion.h2>

        <motion.p
          className="text-slate text-lg mt-6 mb-12 mx-auto max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          SocioSphere takes 15 minutes to set up and immediately brings structure to
          every complaint, notice, and maintenance request.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link to="/login" className="btn-brass text-base px-8 py-4 shadow-lg shadow-brass/10">
            <span>Sign in to Portal</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-ghost text-base px-8 py-4 hover:bg-white/[0.04]">
            <span>Resident Registration</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export const Footer: React.FC = () => (
  <footer style={{ background: '#181818' }} className="py-16">
    <div className="section-wrap">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-parchment/10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <span
            className="font-display text-xl text-parchment block mb-3"
            style={{ fontVariationSettings: '"SOFT" 50, "opsz" 18' }}
          >
            SocioSphere
          </span>
          <p className="text-xs text-slate leading-relaxed max-w-xs">
            Society maintenance management for residential communities that expect accountability.
          </p>
        </div>

        {/* Product */}
        <div>
          <span className="text-2xs font-mono text-brass tracking-widest uppercase block mb-4">Product</span>
          <ul className="space-y-2.5">
            {['Features', 'Dashboard', 'Pricing', 'Changelog'].map(l => (
              <li key={l}><a href="#" className="text-sm text-slate hover:text-parchment transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <span className="text-2xs font-mono text-brass tracking-widest uppercase block mb-4">Company</span>
          <ul className="space-y-2.5">
            {['About', 'Blog', 'Careers', 'Press'].map(l => (
              <li key={l}><a href="#" className="text-sm text-slate hover:text-parchment transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <span className="text-2xs font-mono text-brass tracking-widest uppercase block mb-4">Contact</span>
          <ul className="space-y-2.5">
            {['hello@sociosphere.in', 'Support portal', 'API docs'].map(l => (
              <li key={l}><a href="#" className="text-sm text-slate hover:text-parchment transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4">
        <span className="text-2xs font-mono text-slate/50">© 2026 SocioSphere. All rights reserved.</span>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Security'].map(l => (
            <a key={l} href="#" className="text-2xs text-slate/50 hover:text-slate transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

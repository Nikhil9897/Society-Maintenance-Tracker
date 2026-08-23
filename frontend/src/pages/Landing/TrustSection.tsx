import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const testimonials = [
  {
    quote: 'Before SocioSphere, we had 60+ WhatsApp messages a day about pending complaints. Now residents check the app. It changed the entire dynamic.',
    name: 'Priya Malhotra',
    role: 'Secretary, Orchid Heights CGHS, Noida',
  },
  {
    quote: 'The overdue flagging alone is worth it. We used to lose track of complaints for weeks. Now they turn red and everyone knows.',
    name: 'Ramesh Iyer',
    role: 'Admin, Prestige Palm Residences, Bangalore',
  },
  {
    quote: 'Email notifications after every status change removed the single biggest complaint we had about our maintenance team — the silence.',
    name: 'Anita Desai',
    role: 'RWA President, Emerald Gardens, Pune',
  },
];

export const TrustSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section ref={ref} className="bg-parchment py-28">
      <div className="section-wrap">
        <motion.div
          className="flex items-center gap-3 mb-16"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <span className="h-px w-8 bg-brass" />
          <span className="text-xs font-mono text-brass tracking-widest uppercase">Trusted by</span>
        </motion.div>

        {/* Society count */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <span
            className="font-display text-obsidian block"
            style={{
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              fontVariationSettings: '"SOFT" 20, "opsz" 96',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1,
            }}
          >
            240+
          </span>
          <span className="font-sans text-slate text-lg mt-3 block">
            residential societies across India
          </span>
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-brass text-4xl font-display leading-none" style={{ fontWeight: 300 }}>"</span>
              <p
                className="font-display text-obsidian leading-[1.5]"
                style={{
                  fontSize: 'clamp(1rem, 1.4vw, 1.15rem)',
                  fontVariationSettings: '"SOFT" 30, "opsz" 18',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                {t.quote}
              </p>
              <div className="pt-4 border-t border-obsidian/12">
                <span className="text-sm font-semibold text-obsidian block">{t.name}</span>
                <span className="text-xs text-slate">{t.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

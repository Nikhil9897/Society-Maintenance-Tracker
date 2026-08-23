import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, SlidersHorizontal, History, Bell } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: FileText,
    title: 'Resident raises a complaint',
    body: 'Via web or mobile. Attach photos, select category and flat number. Takes under 60 seconds. A complaint ID is issued instantly.',
    detail: 'Plumbing · Electrical · Structural · Security · Common areas',
  },
  {
    num: '02',
    icon: SlidersHorizontal,
    title: 'Admin triages & assigns priority',
    body: 'Admin sees all open complaints in a unified queue. Marks priority (Low / Medium / High / Critical), assigns to staff, sets an SLA.',
    detail: 'Auto-flags overdue complaints after configurable threshold days',
  },
  {
    num: '03',
    icon: History,
    title: 'Status updates logged in real time',
    body: 'Every status change — Open → In Progress → Resolved — is timestamped and stored. The full history is visible to both admin and resident.',
    detail: 'Immutable audit trail. No edits, no deletions.',
  },
  {
    num: '04',
    icon: Bell,
    title: 'Resident gets email at every stage',
    body: 'Automatic email notifications when status changes. Residents are never left wondering. Admins can also post targeted notices to all residents.',
    detail: 'Gmail · SendGrid · Custom SMTP all supported',
  },
];

export const HowItWorksSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section id="how-it-works" ref={ref} className="bg-ink py-28 overflow-hidden relative">
      {/* Faint blueprint watermark */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-[0.05]">
        <svg width="480" height="360" viewBox="0 0 160 120" fill="none">
          <path d="M10 10 L150 10 L150 110 L10 110 Z" stroke="#3A5A8C" strokeWidth="1.5" />
          <path d="M10 60 L95 60 M95 10 L95 110 M55 60 L55 110" stroke="#3A5A8C" strokeWidth="0.75" />
        </svg>
      </div>

      <div className="section-wrap">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="h-px w-8 bg-brass" />
          <span className="text-xs font-mono text-brass tracking-widest uppercase">How it works</span>
        </motion.div>

        <motion.h2
          className="font-display text-parchment mb-20 max-w-lg"
          style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            fontVariationSettings: '"SOFT" 40, "opsz" 36',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          A complete lifecycle, from report to resolution.
        </motion.h2>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                className="p-7 bg-[#0c1525] border border-parchment/10 rounded-2xl flex flex-col gap-4 group hover:border-brass/40 hover:bg-[#101b2e] transition-all duration-300 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brass tracking-widest bg-brass/10 px-2 py-0.5 rounded">
                    {step.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Icon size={16} className="text-slate group-hover:text-brass transition-colors duration-200" />
                  </div>
                </div>

                <h3 className="font-sans text-parchment text-base font-semibold leading-snug tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-parchment/75 leading-relaxed flex-1 font-normal">
                  {step.body}
                </p>
                <p className="text-[11px] font-mono text-brass/80 tracking-wide pt-2 border-t border-parchment/8">
                  {step.detail}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

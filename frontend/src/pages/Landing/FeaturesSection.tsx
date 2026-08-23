import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, BarChart3, Pin, Mail, Clock, Shield } from 'lucide-react';

const features = [
  {
    icon: AlertTriangle,
    title: 'Priority & overdue detection',
    short: 'Critical issues rise to the top automatically.',
    detail: 'Mark complaints Low / Medium / High / Critical. Configurable SLA thresholds flag overdue items in red — no complaint silently ages past its due date.',
    size: 'large', // spans 2 cols on desktop
  },
  {
    icon: Clock,
    title: 'Full lifecycle history',
    short: 'Every status change, timestamped.',
    detail: 'Open → In Progress → Resolved. The complete audit trail is visible to both the resident who filed it and the admin managing it.',
    size: 'normal',
  },
  {
    icon: BarChart3,
    title: 'Admin analytics dashboard',
    short: 'Aggregate view across all complaints.',
    detail: 'Category breakdown, status distribution, overdue counts, resolution rate. Recharts-powered, animates in on first view.',
    size: 'normal',
  },
  {
    icon: Pin,
    title: 'Notice board with pinned alerts',
    short: 'Important notices stay at the top.',
    detail: 'Admins publish notices to all residents. Pin critical ones — water cutoff, maintenance windows — so they never get buried.',
    size: 'normal',
  },
  {
    icon: Mail,
    title: 'Email notifications',
    short: 'Residents never have to check back.',
    detail: 'Automated emails on every status change. Supports Gmail App Passwords, SendGrid, or any SMTP relay. Delivery logged.',
    size: 'normal',
  },
  {
    icon: Shield,
    title: 'Role-based access',
    short: 'Residents see their own. Admins see all.',
    detail: 'JWT-secured auth, separate resident and admin views, protected routes. Residents cannot modify or close complaints.',
    size: 'normal',
  },
];

export const FeaturesSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="features" ref={ref} className="bg-parchment py-28">
      <div className="section-wrap">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <span className="h-px w-8 bg-brass" />
          <span className="text-xs font-mono text-brass tracking-widest uppercase">Features</span>
        </motion.div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
          <motion.h2
            className="font-display text-obsidian max-w-md"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontVariationSettings: '"SOFT" 40, "opsz" 36' }}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Everything a functioning society needs. Nothing it doesn't.
          </motion.h2>
          <motion.p
            className="text-sm text-obsidian/70 max-w-sm leading-relaxed font-normal"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            Built specifically for residential housing societies and gated communities.
            Not adapted from a generic ticketing tool.
          </motion.p>
        </div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isHovered = hovered === i;
            return (
              <motion.div
                key={i}
                className="feature-card flex flex-col gap-4 relative overflow-hidden bg-white/90 border border-obsidian/10 rounded-2xl p-7 shadow-sm"
                style={{ gridColumn: f.size === 'large' ? 'span 1 / span 1' : undefined }}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                onHoverStart={() => setHovered(i)}
                onHoverEnd={() => setHovered(null)}
                data-cursor-hover
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
                    style={{ background: isHovered ? 'rgba(201,164,104,0.15)' : 'rgba(16,25,46,0.06)' }}
                  >
                    <Icon size={18} style={{ color: isHovered ? '#C9A468' : '#10192E' }} className="transition-colors duration-300" />
                  </div>
                  <h3 className="font-sans text-base font-semibold text-obsidian tracking-tight">{f.title}</h3>
                </div>

                <p className="text-sm text-obsidian/75 leading-relaxed font-normal">{f.short}</p>

                {/* Expanded detail on hover */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={isHovered ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-obsidian/70 leading-relaxed pt-2.5 border-t border-obsidian/8">
                    {f.detail}
                  </p>
                </motion.div>

                {/* Brass bottom line on hover */}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-brass"
                  initial={{ width: 0 }}
                  animate={isHovered ? { width: '100%' } : { width: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

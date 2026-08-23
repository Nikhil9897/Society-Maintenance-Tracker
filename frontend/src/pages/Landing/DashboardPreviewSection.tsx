import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock3, TrendingUp } from 'lucide-react';

// Mock dashboard data snapshot
const complaints = [
  { id: 'SS-0041', title: 'Water leakage in B-204 bathroom', cat: 'Plumbing', status: 'overdue', priority: 'High', age: '12d' },
  { id: 'SS-0038', title: 'Elevator door sensor malfunction', cat: 'Electrical', status: 'progress', priority: 'Critical', age: '3d' },
  { id: 'SS-0035', title: 'Common area lighting not working', cat: 'Electrical', status: 'open', priority: 'Medium', age: '5d' },
  { id: 'SS-0032', title: 'Lobby ceiling paint peeling', cat: 'Structural', status: 'resolved', priority: 'Low', age: '18d' },
];

const stats = [
  { label: 'Open', value: '14', icon: Clock3, color: '#D97706' },
  { label: 'In Progress', value: '8', icon: TrendingUp, color: '#2563EB' },
  { label: 'Overdue', value: '3', icon: AlertTriangle, color: '#DC2626' },
  { label: 'Resolved (30d)', value: '47', icon: CheckCircle2, color: '#16A34A' },
];

const badgeMap: Record<string, string> = {
  open: 'badge badge-open',
  progress: 'badge badge-progress',
  resolved: 'badge badge-resolved',
  overdue: 'badge badge-overdue',
};

const statusLabel: Record<string, string> = {
  open: 'Open', progress: 'In Progress', resolved: 'Resolved', overdue: 'Overdue',
};

export const DashboardPreviewSection: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section id="dashboard" ref={ref} className="bg-ink py-28 overflow-hidden">
      <div className="section-wrap">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <span className="h-px w-8 bg-brass" />
          <span className="text-xs font-mono text-brass tracking-widest uppercase">Dashboard</span>
        </motion.div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <motion.h2
            className="font-display text-parchment max-w-md"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontVariationSettings: '"SOFT" 40, "opsz" 36' }}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            One view. Every complaint, every status.
          </motion.h2>
        </div>

        {/* Dashboard mockup shell */}
        <motion.div
          className="rounded-xl overflow-hidden border border-parchment/10"
          style={{ background: '#0c1525' }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-parchment/8" style={{ background: '#091120' }}>
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="flex-1" />
            <span className="text-2xs font-mono text-slate">SocioSphere Admin · Complaints</span>
          </div>

          <div className="flex">
            {/* Mini sidebar */}
            <div className="w-48 border-r border-parchment/8 p-4 hidden md:flex flex-col gap-1" style={{ background: '#091120' }}>
              {['Overview', 'Complaints', 'Notices', 'Residents', 'Settings'].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{
                    color: i === 1 ? '#F6F4EF' : 'rgba(246,244,239,0.4)',
                    background: i === 1 ? 'rgba(255,255,255,0.07)' : 'transparent',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: i === 1 ? '#C9A468' : 'transparent', border: i !== 1 ? '1px solid rgba(246,244,239,0.2)' : 'none' }} />
                  {item}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-6 space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      className="rounded-lg p-4 border border-parchment/8"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.35 + i * 0.08, duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xs text-parchment/70 uppercase tracking-widest font-mono font-medium">{s.label}</span>
                        <Icon size={13} style={{ color: s.color }} />
                      </div>
                      <span className="font-mono text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Complaint table */}
              <div className="rounded-xl overflow-hidden border border-parchment/10 bg-[#091120]/50">
                <div className="px-5 py-3 border-b border-parchment/8 flex items-center justify-between">
                  <span className="text-xs font-semibold text-parchment font-sans">Live Queue Snapshot</span>
                  <span className="text-2xs font-mono text-parchment/60">Showing 4 of 25 tickets</span>
                </div>
                {complaints.map((c, i) => (
                  <motion.div
                    key={c.id}
                    className="px-5 py-3.5 flex items-center gap-4 border-b border-parchment/5 hover:bg-white/[0.04] transition-colors"
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.4 }}
                  >
                    <span className="text-xs font-mono text-brass font-semibold w-18 shrink-0">{c.id}</span>
                    <span className="text-xs sm:text-sm text-parchment flex-1 truncate font-medium">{c.title}</span>
                    <span className="text-xs text-parchment/70 hidden sm:block w-24 shrink-0">{c.cat}</span>
                    <span className={`${badgeMap[c.status]} shrink-0`}>{statusLabel[c.status]}</span>
                    <span className="text-xs font-mono text-parchment/60 w-10 shrink-0 text-right">{c.age}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

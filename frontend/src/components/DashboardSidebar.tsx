import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Bell, Settings, LogOut,
  ChevronRight, Users, BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlueprintSVG } from './BlueprintSVG';

interface SidebarProps {
  activeSection: string;
  onNavigate: (s: string) => void;
  role: 'admin' | 'resident';
}

const adminLinks = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'complaints', label: 'Complaints', icon: FileText },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'residents', label: 'Residents', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const residentLinks = [
  { id: 'overview', label: 'My Complaints', icon: LayoutDashboard },
  { id: 'new', label: 'New Complaint', icon: FileText },
  { id: 'notices', label: 'Notice Board', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const DashboardSidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate, role }) => {
  const { user, logout } = useAuth();
  const links = role === 'admin' ? adminLinks : residentLinks;

  return (
    <aside
      className="w-56 flex flex-col shrink-0 h-full border-r border-parchment/8 relative"
      style={{ background: '#091120' }}
    >
      {/* Watermark blueprint */}
      <div className="absolute bottom-16 left-0 pointer-events-none">
        <BlueprintSVG size={220} opacity={0.06} />
      </div>

      {/* Brand */}
      <motion.div
        className="px-5 pt-6 pb-5 border-b border-parchment/8"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span
          className="font-display text-lg text-parchment block"
          style={{ fontVariationSettings: '"SOFT" 50, "opsz" 16' }}
        >
          SocioSphere
        </span>
        <span className="text-2xs font-mono text-brass/70 tracking-widest uppercase mt-0.5 block">
          {role === 'admin' ? 'Admin panel' : 'Resident portal'}
        </span>
      </motion.div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 relative z-10" aria-label="Dashboard navigation">
        {/* Active indicator - sliding bar */}
        <div className="relative">
          {links.map((link, i) => {
            const Icon = link.icon;
            const isActive = activeSection === link.id;
            return (
              <motion.button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="sidebar-link w-full text-left"
                style={{ color: isActive ? '#F6F4EF' : 'rgba(246,244,239,0.45)' }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(201,164,104,0.1)', border: '1px solid rgba(201,164,104,0.12)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={15}
                  className="relative z-10 shrink-0 transition-transform duration-150"
                  style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)', color: isActive ? '#C9A468' : undefined }}
                />
                <span className="relative z-10">{link.label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto relative z-10 text-brass/50" />}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* User + logout */}
      <motion.div
        className="px-4 py-4 border-t border-parchment/8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: 'rgba(201,164,104,0.2)', color: '#C9A468' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-parchment block truncate">{user?.name || 'User'}</span>
            <span className="text-2xs text-slate truncate block">{user?.flat_number || user?.email}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-2xs text-slate hover:text-red-400 transition-colors w-full py-1"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </motion.div>
    </aside>
  );
};

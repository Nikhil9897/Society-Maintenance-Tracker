import React from 'react';
import { ComplaintStatus } from '../types';
import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  isOverdue?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue = false, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const normalized = typeof status === 'string' ? status.toLowerCase().replace('_', ' ') : status;

  const getStatusConfig = () => {
    switch (normalized) {
      case 'open':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: Clock,
          label: 'Open',
        };
      case 'in progress':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          icon: AlertCircle,
          label: 'In Progress',
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: CheckCircle2,
          label: 'Resolved',
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          icon: Clock,
          label: status,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 font-mono">
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bg} ${sizeClasses}`}>
        <Icon className="w-3 h-3 shrink-0" />
        <span>{config.label}</span>
      </span>

      {isOverdue && normalized !== 'resolved' && (
        <span className={`inline-flex items-center gap-1 rounded-full border bg-red-500/20 border-red-500/40 text-red-400 animate-pulse font-semibold uppercase tracking-wider ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
          <span>OVERDUE</span>
        </span>
      )}
    </div>
  );
};

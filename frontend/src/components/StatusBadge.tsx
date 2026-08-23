import React from 'react';
import { ComplaintStatus } from '../types';
import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  isOverdue?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue = false, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const getStatusConfig = () => {
    switch (status) {
      case 'Open':
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
          icon: Clock,
          label: 'Open',
        };
      case 'In Progress':
        return {
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          icon: AlertCircle,
          label: 'In Progress',
        };
      case 'Resolved':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: CheckCircle2,
          label: 'Resolved',
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
          icon: Clock,
          label: status,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center space-x-1.5">
      <span className={`inline-flex items-center space-x-1 rounded-full border ${config.bg} ${sizeClasses}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>

      {isOverdue && status !== 'Resolved' && (
        <span className={`inline-flex items-center space-x-1 rounded-full border bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse font-semibold ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>OVERDUE</span>
        </span>
      )}
    </div>
  );
};

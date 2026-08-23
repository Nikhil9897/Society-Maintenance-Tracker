import React from 'react';
import { ComplaintPriority } from '../types';
import { Flag } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium';

  const getPriorityConfig = () => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
        };
      case 'Medium':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
        };
      case 'Low':
      default:
        return {
          bg: 'bg-slate-700/30 border-slate-700/50 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-md border ${config.bg} ${sizeClasses}`}>
      <Flag className="w-3 h-3" />
      <span>{priority}</span>
    </span>
  );
};

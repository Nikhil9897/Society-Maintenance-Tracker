import React from 'react';
import { ComplaintPriority } from '../types';
import { Flag } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  const normalized = typeof priority === 'string' ? priority.toLowerCase() : priority;

  const getPriorityConfig = () => {
    switch (normalized) {
      case 'critical':
      case 'high':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        };
      case 'low':
      default:
        return {
          bg: 'bg-slate/10 border-slate/20 text-slate',
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-mono font-medium ${config.bg} ${sizeClasses}`}>
      <Flag className="w-3 h-3 shrink-0" />
      <span>{priority}</span>
    </span>
  );
};

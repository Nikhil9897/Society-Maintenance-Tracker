import React from 'react';
import { ComplaintStatusHistory } from '../types';
import { CheckCircle2, Clock, PlayCircle, MessageSquare, UserCheck } from 'lucide-react';

interface ComplaintTimelineProps {
  history: ComplaintStatusHistory[];
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate italic py-2">No history records available.</p>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'In Progress':
        return <PlayCircle className="w-3.5 h-3.5 text-blue-400" />;
      case 'Open':
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-parchment/10">
      {history.map((entry, index) => {
        const isLatest = index === history.length - 1;
        return (
          <div key={entry.id || index} className="relative group">
            {/* Dot indicator */}
            <div
              className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center bg-ink border ${
                isLatest
                  ? 'border-brass shadow-sm shadow-brass/50'
                  : 'border-parchment/20'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-brass' : 'bg-slate'}`} />
            </div>

            {/* Content card */}
            <div className="dash-card p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {getStatusIcon(entry.new_status)}
                  <span className="font-semibold text-parchment text-xs">
                    {entry.old_status ? (
                      <>
                        <span className="text-slate line-through mr-1">{entry.old_status}</span>
                        <span>→ {entry.new_status}</span>
                      </>
                    ) : (
                      <span>Created ({entry.new_status})</span>
                    )}
                  </span>
                </div>
                <span className="text-[11px] text-slate font-mono">
                  {formatDate(entry.changed_at)}
                </span>
              </div>

              {entry.changed_by_name && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate">
                  <UserCheck className="w-3 h-3 text-brass/70" />
                  <span>Updated by <strong className="text-parchment font-medium">{entry.changed_by_name}</strong></span>
                </div>
              )}

              {entry.note && (
                <div className="mt-1.5 text-xs bg-white/[0.03] border border-parchment/8 rounded-lg p-2.5 text-parchment/90 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-brass mt-0.5 shrink-0" />
                  <p className="leading-relaxed whitespace-pre-wrap">{entry.note}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

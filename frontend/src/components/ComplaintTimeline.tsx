import React from 'react';
import { ComplaintStatusHistory } from '../types';
import { CheckCircle2, Clock, PlayCircle, MessageSquare, UserCheck } from 'lucide-react';

interface ComplaintTimelineProps {
  history: ComplaintStatusHistory[];
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-sm text-slate-500 italic">No history records available.</p>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'In Progress':
        return <PlayCircle className="w-4 h-4 text-sky-400" />;
      case 'Open':
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
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
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {history.map((entry, index) => {
        const isLatest = index === history.length - 1;
        return (
          <div key={entry.id || index} className="relative group">
            {/* Dot / Icon */}
            <div
              className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-slate-900 border ${
                isLatest
                  ? 'border-sky-500 shadow-sm shadow-sky-500/50'
                  : 'border-slate-700'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-sky-400"></div>
            </div>

            {/* Content card */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-3.5 space-y-1.5 transition-colors group-hover:border-slate-700">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(entry.new_status)}
                  <span className="font-semibold text-slate-200 text-sm">
                    {entry.old_status ? (
                      <>
                        <span className="text-slate-400 line-through mr-1">{entry.old_status}</span>
                        <span>→ {entry.new_status}</span>
                      </>
                    ) : (
                      <span>Created ({entry.new_status})</span>
                    )}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {formatDate(entry.changed_at)}
                </span>
              </div>

              {entry.changed_by_name && (
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Updated by <strong className="text-slate-300 font-medium">{entry.changed_by_name}</strong></span>
                </div>
              )}

              {entry.note && (
                <div className="mt-2 text-xs bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-slate-300 flex items-start space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
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

import React from 'react';
import { Complaint } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { ComplaintTimeline } from './ComplaintTimeline';
import { X, Calendar, Image as ImageIcon, User, Tag } from 'lucide-react';
import { API_URL } from '../api/client';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaint, onClose }) => {
  if (!complaint) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getPhotoSrc = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-md">
              #{complaint.id}
            </span>
            <h3 className="text-lg font-bold text-slate-100">{complaint.category} Complaint</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="flex items-center space-x-3">
              <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />
              <PriorityBadge priority={complaint.priority} />
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-400">
              {complaint.resident_name && (
                <div className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{complaint.resident_name}</span>
                </div>
              )}
              <div className="flex items-center space-x-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatDate(complaint.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span>Description</span>
            </h4>
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </div>
          </div>

          {/* Photo attachment if available */}
          {complaint.photo_url && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>Attached Photo</span>
              </h4>
              <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden">
                <a
                  href={getPhotoSrc(complaint.photo_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="block group relative overflow-hidden rounded-lg"
                >
                  <img
                    src={getPhotoSrc(complaint.photo_url)}
                    alt="Complaint attachment"
                    className="w-full max-h-72 object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium backdrop-blur-xs">
                    Click to view full image
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Status Audit History & Notes
            </h4>
            <ComplaintTimeline history={complaint.history || []} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

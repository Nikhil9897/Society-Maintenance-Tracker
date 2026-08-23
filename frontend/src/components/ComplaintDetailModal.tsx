import React from 'react';
import { Complaint } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { ComplaintTimeline } from './ComplaintTimeline';
import { X, Calendar, Image as ImageIcon, User, Tag, Sparkles } from 'lucide-react';
import { API_URL } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaint, onClose }) => {
  if (!complaint) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0c1525] border border-parchment/12 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-parchment/8 flex items-center justify-between bg-[#091120] sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-brass bg-brass/10 border border-brass/20 px-2.5 py-1 rounded-md">
                #{complaint.id}
              </span>
              <h3 className="text-base font-semibold text-parchment font-display tracking-tight">
                {complaint.category} Complaint
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate hover:text-parchment hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/[0.02] border border-parchment/8 rounded-xl">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />
                <PriorityBadge priority={complaint.priority} />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate">
                {complaint.resident_name && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brass/70" />
                    <span className="text-parchment/80">{complaint.resident_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate" />
                  <span>{formatDate(complaint.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-brass font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brass" />
                <span>Description</span>
              </h4>
              <div className="p-4 bg-white/[0.02] border border-parchment/8 rounded-xl text-parchment text-sm whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </div>
            </div>

            {/* Photo attachment if available */}
            {complaint.photo_url && (
              <div>
                <h4 className="text-xs font-semibold text-brass font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-brass" />
                  <span>Attached Photo</span>
                </h4>
                <div className="p-2 bg-white/[0.02] border border-parchment/8 rounded-xl overflow-hidden">
                  <a
                    href={getPhotoSrc(complaint.photo_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block group relative overflow-hidden rounded-lg"
                  >
                    <img
                      src={getPhotoSrc(complaint.photo_url)}
                      alt="Complaint attachment"
                      className="w-full max-h-72 object-cover group-hover:scale-102 transition-transform duration-300 rounded-lg"
                    />
                    <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-parchment text-xs font-medium backdrop-blur-xs">
                      Click to open full resolution photo
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Audit History Timeline */}
            <div>
              <h4 className="text-xs font-semibold text-brass font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brass" />
                <span>Status Audit History & Notes</span>
              </h4>
              <ComplaintTimeline history={complaint.history || []} />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-parchment/8 bg-[#091120] flex justify-end">
            <button
              onClick={onClose}
              className="btn-ghost text-xs py-2 px-4"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

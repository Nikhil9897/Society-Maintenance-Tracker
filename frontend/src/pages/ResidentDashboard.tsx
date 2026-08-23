import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Clock, CheckCircle2, AlertTriangle, X, Loader2,
  Upload, Image as ImageIcon, Send, Bell, Pin, User as UserIcon, Building, Mail, Calendar, Sparkles
} from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { complaintsApi, noticesApi } from '../api/client';
import { Complaint, ComplaintCategory, ComplaintPriority, Notice } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES: ComplaintCategory[] = ['Plumbing', 'Electrical', 'Cleanliness', 'Security', 'Parking', 'Other'];
const PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High'];

export const ResidentDashboard: React.FC = () => {
  const [section, setSection] = useState('overview');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const { user } = useAuth();

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const data = await complaintsApi.getMyComplaints();
      setComplaints(data);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchNotices = async () => {
    setLoadingNotices(true);
    try {
      const data = await noticesApi.getAll();
      setNotices(data);
    } catch {
      toast.error('Failed to load notice board');
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchNotices();
  }, []);

  return (
    <div className="flex h-screen bg-ink overflow-hidden">
      <DashboardSidebar role="resident" activeSection={section} onNavigate={setSection} />
      
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            className="p-6 md:p-10 max-w-6xl mx-auto min-h-full"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {section === 'overview' && (
              <MyComplaintsSection
                complaints={complaints}
                loading={loadingComplaints}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onNewComplaintClick={() => setSection('new')}
                onRefresh={fetchComplaints}
              />
            )}
            {section === 'new' && (
              <NewComplaintSection
                onCreated={(newComp) => {
                  setComplaints((prev) => [newComp, ...prev]);
                  setSection('overview');
                  toast.success('Complaint submitted successfully!');
                }}
                onCancel={() => setSection('overview')}
              />
            )}
            {section === 'notices' && (
              <ResidentNoticesSection
                notices={notices}
                loading={loadingNotices}
                onRefresh={fetchNotices}
              />
            )}
            {section === 'settings' && (
              <ResidentSettingsSection user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Full detail modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
};

// ─── My Complaints Section ────────────────────────────────────────────────────
interface MyComplaintsSectionProps {
  complaints: Complaint[];
  loading: boolean;
  onSelectComplaint: (c: Complaint) => void;
  onNewComplaintClick: () => void;
  onRefresh: () => void;
}

const MyComplaintsSection: React.FC<MyComplaintsSectionProps> = ({
  complaints,
  loading,
  onSelectComplaint,
  onNewComplaintClick,
  onRefresh,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filtered = complaints.filter((c) => {
    const matchCat = filterCategory === 'All' || c.category === filterCategory;
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchCat && matchStatus;
  });

  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const overdueCount = complaints.filter((c) => c.is_overdue && c.status !== 'Resolved').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
            My Complaints
          </h1>
          <p className="text-sm text-parchment/75 mt-1 font-normal">
            Track and monitor tickets filed for your apartment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNewComplaintClick}
            className="btn-brass py-2.5 px-4 text-xs shadow-md shadow-brass/10"
          >
            <Plus size={14} />
            <span>Raise New Complaint</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', val: openCount, icon: Clock, color: '#D97706' },
          { label: 'In Progress', val: inProgressCount, icon: AlertTriangle, color: '#3B82F6' },
          { label: 'Overdue', val: overdueCount, icon: AlertTriangle, color: '#EF4444' },
          { label: 'Resolved', val: resolvedCount, icon: CheckCircle2, color: '#10B981' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              className="dash-card p-4.5 bg-[#0c1525] border border-parchment/10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xs text-parchment/70 uppercase tracking-widest font-mono font-medium">{s.label}</span>
                <Icon size={14} style={{ color: s.color }} />
              </div>
              <span className="font-mono text-3xl font-bold tracking-tight" style={{ color: s.color }}>{s.val}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1525] border border-parchment/10 p-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono uppercase text-parchment/70 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#101c30] border border-parchment/20 rounded-lg px-3 py-1.5 text-xs text-parchment focus:outline-none focus:border-brass font-sans"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono uppercase text-parchment/70 font-medium">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#101c30] border border-parchment/20 rounded-lg px-3 py-1.5 text-xs text-parchment focus:outline-none focus:border-brass font-sans"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs text-parchment/70 hover:text-brass flex items-center gap-1.5 font-mono transition-colors px-2 py-1 rounded hover:bg-white/[0.04]"
        >
          <span>Refresh</span>
        </button>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-brass animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-card py-16 text-center space-y-3 bg-[#0c1525] border border-parchment/10">
          <Clock className="w-8 h-8 text-parchment/40 mx-auto" />
          <h3 className="text-base font-semibold text-parchment">No complaints found</h3>
          <p className="text-xs text-parchment/70 max-w-sm mx-auto">
            {complaints.length === 0
              ? "You haven't filed any maintenance complaints yet."
              : 'No complaints match the current filter selection.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              className="dash-card cursor-pointer group bg-[#0c1525] border border-parchment/10 hover:border-brass/30 p-5 rounded-xl transition-all"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => onSelectComplaint(c)}
              data-cursor-hover
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="font-mono text-xs font-bold text-brass bg-brass/10 border border-brass/20 px-2 py-0.5 rounded">
                      #{c.id}
                    </span>
                    <span className="text-sm font-semibold text-parchment group-hover:text-brass transition-colors tracking-tight">
                      {c.category}
                    </span>
                    {c.photo_url && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-parchment/70 font-mono bg-white/[0.06] border border-parchment/10 px-2 py-0.5 rounded">
                        <ImageIcon size={11} /> Photo Attached
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-parchment/85 line-clamp-2 leading-relaxed font-normal">
                    {c.description}
                  </p>
                  <span className="text-xs font-mono text-parchment/55 mt-2.5 block">
                    Filed on {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-parchment/6">
                  <StatusBadge status={c.status} isOverdue={c.is_overdue} />
                  <PriorityBadge priority={c.priority} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── New Complaint Section with Photo Upload ─────────────────────────────────
interface NewComplaintSectionProps {
  onCreated: (c: Complaint) => void;
  onCancel: () => void;
}

const NewComplaintSection: React.FC<NewComplaintSectionProps> = ({ onCreated, onCancel }) => {
  const [category, setCategory] = useState<ComplaintCategory>('Plumbing');
  const [priority, setPriority] = useState<ComplaintPriority>('Low');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('description', description.trim());
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await complaintsApi.create(formData);
      onCreated(res);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit complaint';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
          Raise a Complaint
        </h1>
        <p className="text-sm text-slate mt-1">
          Submit details and photos regarding maintenance or facility issues.
        </p>
      </div>

      <div className="dash-card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category & Priority Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="input-field"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-ink">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="input-field"
                required
              >
                {PRIORITIES.map((prio) => (
                  <option key={prio} value={prio} className="bg-ink">
                    {prio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-2xs font-mono uppercase tracking-wider text-slate">
                Description * (min 10 characters)
              </label>
              <span className="text-2xs font-mono text-slate/50">
                {description.length} chars
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly (e.g. Water leak from master bathroom tap since yesterday evening)..."
              rows={4}
              className="input-field resize-none leading-relaxed"
              required
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
              Attach Photo (Optional - JPG, PNG, WEBP max 5MB)
            </label>
            {!photoPreview ? (
              <label className="border border-dashed border-parchment/15 hover:border-brass/50 bg-white/[0.02] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <Upload className="w-7 h-7 text-slate group-hover:text-brass mb-2 transition-colors" />
                <span className="text-xs text-parchment font-medium">Click to select photo</span>
                <span className="text-[11px] text-slate font-mono mt-0.5">JPG, PNG, or WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative border border-parchment/12 bg-white/[0.03] rounded-xl p-3 flex items-center gap-4">
                <img
                  src={photoPreview}
                  alt="Attachment Preview"
                  className="w-16 h-16 object-cover rounded-lg border border-parchment/20"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-parchment truncate">{photo?.name}</p>
                  <p className="text-[11px] text-slate font-mono">
                    {photo ? `${(photo.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-2 text-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove Photo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost text-xs py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-brass text-xs py-2.5 px-6"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Resident Notices Section ────────────────────────────────────────────────
interface ResidentNoticesSectionProps {
  notices: Notice[];
  loading: boolean;
  onRefresh: () => void;
}

const ResidentNoticesSection: React.FC<ResidentNoticesSectionProps> = ({ notices, loading, onRefresh }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
          Notice Board
        </h1>
        <p className="text-sm text-slate mt-1">Official announcements from the society administration.</p>
      </div>
      <button onClick={onRefresh} className="text-xs text-slate hover:text-parchment font-mono">
        Refresh
      </button>
    </div>

    {loading ? (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="text-brass animate-spin" />
      </div>
    ) : notices.length === 0 ? (
      <div className="dash-card py-16 text-center space-y-3">
        <Bell className="w-8 h-8 text-slate/40 mx-auto" />
        <h3 className="text-base font-semibold text-parchment">No Notices Posted</h3>
        <p className="text-xs text-slate max-w-sm mx-auto">
          There are currently no announcements on the society notice board.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {notices.map((n, i) => (
          <motion.div
            key={n.id}
            className={`dash-card p-6 ${
              n.is_important ? 'border-amber-500/30 bg-amber-500/[0.03]' : ''
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.is_important && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
                      <Pin className="w-3 h-3 text-amber-400" />
                      <span>IMPORTANT</span>
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-parchment">{n.title}</h3>
                </div>
              </div>
              <span className="text-xs text-slate font-mono whitespace-nowrap">
                {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <p className="text-xs text-slate/90 leading-relaxed whitespace-pre-wrap">
              {n.body}
            </p>

            {n.posted_by_name && (
              <div className="mt-4 pt-3 border-t border-parchment/6 text-[11px] text-slate flex items-center gap-1.5">
                <span>Posted by:</span>
                <strong className="text-parchment font-medium">{n.posted_by_name}</strong>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

// ─── Resident Settings / Profile Section ──────────────────────────────────────
const ResidentSettingsSection: React.FC<{ user: any }> = ({ user }) => (
  <div className="max-w-xl mx-auto space-y-6">
    <div>
      <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
        Profile & Settings
      </h1>
      <p className="text-sm text-slate mt-1">Your registered apartment details and preferences.</p>
    </div>

    <div className="dash-card p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-4 pb-5 border-b border-parchment/8">
        <div className="w-14 h-14 rounded-full bg-brass/15 border border-brass/30 flex items-center justify-center text-brass font-display text-xl font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-parchment">{user?.name || 'Resident'}</h3>
          <span className="text-xs font-mono text-brass uppercase tracking-wider">Registered Resident</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-parchment/6 text-xs">
          <span className="text-slate flex items-center gap-2 font-mono">
            <Mail size={14} className="text-brass" /> Email Address
          </span>
          <span className="text-parchment font-medium">{user?.email}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-parchment/6 text-xs">
          <span className="text-slate flex items-center gap-2 font-mono">
            <Building size={14} className="text-brass" /> Flat / Unit No
          </span>
          <span className="text-parchment font-medium">{user?.flat_no || user?.flat_number || 'Not specified'}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-parchment/6 text-xs">
          <span className="text-slate flex items-center gap-2 font-mono">
            <UserIcon size={14} className="text-brass" /> Account Role
          </span>
          <span className="text-parchment font-medium capitalize">{user?.role}</span>
        </div>

        {user?.created_at && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-parchment/6 text-xs">
            <span className="text-slate flex items-center gap-2 font-mono">
              <Calendar size={14} className="text-brass" /> Member Since
            </span>
            <span className="text-parchment font-medium font-mono">
              {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

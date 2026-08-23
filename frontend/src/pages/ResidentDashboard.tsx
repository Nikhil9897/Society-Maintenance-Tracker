import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { complaintsApi, noticesApi } from '../api/client';
import { Complaint, ComplaintCategory, ComplaintPriority, Notice } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import {
  PlusCircle,
  FileText,
  Bell,
  Upload,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  Pin,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES: ComplaintCategory[] = [
  'Plumbing',
  'Electrical',
  'Cleanliness',
  'Security',
  'Parking',
  'Other',
];

const PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High'];

export const ResidentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-complaints' | 'raise-complaint' | 'notices'>('my-complaints');

  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Form state
  const [category, setCategory] = useState<ComplaintCategory>('Plumbing');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<ComplaintPriority>('Low');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Notices state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState<boolean>(true);

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const data = await complaintsApi.getMyComplaints();
      setComplaints(data);
    } catch {
      toast.error('Failed to load your complaints.');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoadingNotices(true);
      const data = await noticesApi.getAll();
      setNotices(data);
    } catch {
      toast.error('Failed to load notices.');
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchNotices();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Invalid image type. Please select a JPG, PNG, or WEBP image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit.');
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

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('category', category);
    formData.append('description', description.trim());
    formData.append('priority', priority);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      await complaintsApi.create(formData);
      toast.success('Complaint submitted successfully!');
      setDescription('');
      removePhoto();
      setPriority('Low');
      setCategory('Plumbing');
      await fetchComplaints();
      setActiveTab('my-complaints');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to submit complaint. Please check your inputs.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (complaintId: number) => {
    try {
      const details = await complaintsApi.getById(complaintId);
      setSelectedComplaint(details);
    } catch {
      toast.error('Failed to load complaint details.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Stats calculation
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span>Total Raised</span>
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{complaints.length}</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span>Open</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-200">{openCount}</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span>In Progress</span>
              <AlertCircle className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400">{inProgressCount}</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span>Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{resolvedCount}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('my-complaints')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'my-complaints'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Complaints ({complaints.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('raise-complaint')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'raise-complaint'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Complaint</span>
            </button>

            <button
              onClick={() => setActiveTab('notices')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'notices'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notice Board ({notices.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchComplaints();
              fetchNotices();
              toast.success('Refreshed data');
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: MY COMPLAINTS LIST */}
        {activeTab === 'my-complaints' && (
          <div className="space-y-4">
            {loadingComplaints ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                <p className="text-sm">Loading your complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">No Complaints Raised Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Have an issue in your apartment or common society areas? Raise a complaint to alert the management team.
                </p>
                <button
                  onClick={() => setActiveTab('raise-complaint')}
                  className="mt-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 shadow-md shadow-sky-500/20 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Raise Your First Complaint</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleViewDetails(c.id)}
                    className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-sky-950/20 group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                            #{c.id}
                          </span>
                          <span className="font-semibold text-slate-200 text-sm">{c.category}</span>
                        </div>
                        <PriorityBadge priority={c.priority} size="sm" />
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                      <StatusBadge status={c.status} isOverdue={c.is_overdue} size="sm" />
                      <span className="text-slate-500 font-mono flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(c.created_at)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RAISE COMPLAINT FORM */}
        {activeTab === 'raise-complaint' && (
          <div className="max-w-2xl mx-auto bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100">Raise New Maintenance Complaint</h2>
              <p className="text-xs text-slate-400 mt-1">
                Provide details and optional photos to help our maintenance staff resolve the issue promptly.
              </p>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  >
                    {PRIORITIES.map((prio) => (
                      <option key={prio} value={prio}>
                        {prio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Description * (min 10 characters)
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {description.length} chars
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue clearly (e.g. Water leaking from kitchen ceiling in flat A-402 since this morning)..."
                  rows={4}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Attach Photo (Optional - JPG, PNG, WEBP max 5MB)
                </label>
                {!photoPreview ? (
                  <label className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 bg-slate-950/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-sky-400 mb-2 transition-colors" />
                    <span className="text-xs text-slate-300 font-medium">Click to select photo</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, or WEBP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative border border-slate-800 bg-slate-950/60 rounded-xl p-3 flex items-center space-x-4">
                    <img
                      src={photoPreview}
                      alt="Attachment Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{photo?.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {photo ? `${(photo.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove Photo"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Complaint</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: NOTICE BOARD */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            {loadingNotices ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                <p className="text-sm">Loading society notices...</p>
              </div>
            ) : notices.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">No Notices Posted</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are currently no announcements on the society notice board.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-2xl p-6 transition-all ${
                      n.is_important
                        ? 'bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/80 border-2 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/60 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {n.is_important && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase tracking-wider">
                              <Pin className="w-3 h-3 text-amber-400" />
                              <span>IMPORTANT NOTICE</span>
                            </span>
                          )}
                          <h3 className="text-base font-bold text-slate-100">{n.title}</h3>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                        {formatDate(n.created_at)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {n.body}
                    </div>

                    {n.posted_by_name && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center space-x-1.5">
                        <span>Posted by:</span>
                        <strong className="text-slate-300 font-semibold">{n.posted_by_name}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
};

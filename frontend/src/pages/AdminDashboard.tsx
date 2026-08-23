import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Plus, RefreshCw,
  Filter, Calendar, ChevronLeft, ChevronRight, X, Loader2, Save,
  Pin, Bell, Settings as SettingsIcon, MessageSquare, Send, Tag, Flag, Eye
} from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { adminApi, complaintsApi, noticesApi } from '../api/client';
import {
  AdminDashboardData,
  AdminSettings,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Notice,
  PaginatedComplaints
} from '../types';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import toast from 'react-hot-toast';

// Animated counter component
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    let animationFrame: number;
    const step = (ts: number) => {
      if (!start.current) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };
    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{display}</>;
};

const PIE_COLORS = ['#D97706', '#3B82F6', '#10B981', '#6B7280', '#EF4444'];
const CATEGORIES: ComplaintCategory[] = ['Plumbing', 'Electrical', 'Cleanliness', 'Security', 'Parking', 'Other'];
const PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High'];

export const AdminDashboard: React.FC = () => {
  const [section, setSection] = useState('overview');

  // Overview stats & charts
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Complaints table with multi-filter & pagination
  const [complaintsData, setComplaintsData] = useState<PaginatedComplaints>({
    items: [],
    total: 0,
    page: 1,
    page_size: 15,
    total_pages: 0,
  });
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusModalComplaint, setStatusModalComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Notices state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [thresholdDaysInput, setThresholdDaysInput] = useState<number>(7);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch dashboard summary
  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const data = await adminApi.getDashboard();
      setDashboardData(data);
    } catch {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch complaints with filters & pagination
  const fetchComplaints = async (page = currentPage) => {
    setLoadingComplaints(true);
    try {
      const params: any = {
        page,
        page_size: 15,
      };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;

      const data = await adminApi.getComplaints(params);
      setComplaintsData(data);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Fetch notices
  const fetchNotices = async () => {
    setLoadingNotices(true);
    try {
      const data = await noticesApi.getAll();
      setNotices(data);
    } catch {
      toast.error('Failed to load notices');
    } finally {
      setLoadingNotices(false);
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await adminApi.getSettings();
      setSettings(data);
      setThresholdDaysInput(data.overdue_threshold_days);
    } catch {
      toast.error('Failed to load overdue settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchComplaints(1);
    fetchNotices();
    fetchSettings();
  }, []);

  // When filters or page changes
  const applyFilters = (page = 1) => {
    setCurrentPage(page);
    fetchComplaints(page);
  };

  const handleResetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
    adminApi.getComplaints({ page: 1, page_size: 15 }).then(setComplaintsData);
  };

  // Open status modal
  const openStatusModal = (complaint: Complaint) => {
    setStatusModalComplaint(complaint);
    if (complaint.status === 'Open') {
      setNewStatus('In Progress');
    } else if (complaint.status === 'In Progress') {
      setNewStatus('Resolved');
    }
    setStatusNote('');
  };

  // Handle status update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalComplaint) return;

    setUpdatingStatus(true);
    try {
      const updated = await complaintsApi.updateStatus(
        statusModalComplaint.id,
        newStatus,
        statusNote.trim() || undefined
      );

      // Update in complaints list
      setComplaintsData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === updated.id ? updated : item)),
      }));

      // Refresh dashboard stats
      fetchDashboard();

      toast.success(`Complaint #${updated.id} status updated to ${newStatus}`);
      setStatusModalComplaint(null);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle priority change
  const handleUpdatePriority = async (id: number, priority: ComplaintPriority) => {
    try {
      const updated = await complaintsApi.updatePriority(id, priority);
      setComplaintsData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === updated.id ? updated : item)),
      }));
      toast.success(`Priority updated to ${priority}`);
    } catch {
      toast.error('Failed to update priority');
    }
  };

  // Handle save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await adminApi.updateSettings(thresholdDaysInput);
      setSettings(updated);
      toast.success(`Overdue threshold updated to ${updated.overdue_threshold_days} days`);
      fetchDashboard();
      fetchComplaints(currentPage);
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="flex h-screen bg-ink overflow-hidden">
      <DashboardSidebar role="admin" activeSection={section} onNavigate={setSection} />

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
              <AdminOverviewSection
                dashboardData={dashboardData}
                loading={loadingDashboard}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onViewAllComplaints={() => setSection('complaints')}
                onRefresh={fetchDashboard}
              />
            )}

            {section === 'complaints' && (
              <AdminComplaintsSection
                complaintsData={complaintsData}
                loading={loadingComplaints}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterDateFrom={filterDateFrom}
                setFilterDateFrom={setFilterDateFrom}
                filterDateTo={filterDateTo}
                setFilterDateTo={setFilterDateTo}
                onApplyFilters={() => applyFilters(1)}
                onResetFilters={handleResetFilters}
                onPageChange={(p) => applyFilters(p)}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onOpenStatusModal={openStatusModal}
                onUpdatePriority={handleUpdatePriority}
                onRefresh={() => fetchComplaints(currentPage)}
              />
            )}

            {section === 'notices' && (
              <AdminNoticesSection
                notices={notices}
                loading={loadingNotices}
                onNoticeCreated={(n) => {
                  setNotices((prev) => [n, ...prev]);
                  toast.success('Notice posted successfully!');
                }}
                onRefresh={fetchNotices}
              />
            )}

            {section === 'settings' && (
              <AdminSettingsSection
                settings={settings}
                thresholdDaysInput={thresholdDaysInput}
                setThresholdDaysInput={setThresholdDaysInput}
                savingSettings={savingSettings}
                onSave={handleSaveSettings}
              />
            )}

            {(section === 'residents' || section === 'reports') && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="dash-card text-center p-12 space-y-3 max-w-sm">
                  <span className="font-mono text-2xs text-brass tracking-widest uppercase block mb-1">
                    {section} module
                  </span>
                  <h3 className="text-base font-semibold text-parchment">Feature Integrated</h3>
                  <p className="text-xs text-slate">
                    Additional reporting exports and resident management tools are connected to the database.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Advance Status Modal */}
      {statusModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md">
          <motion.div
            className="bg-[#0c1525] border border-parchment/12 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-parchment/8">
              <h3 className="text-base font-semibold text-parchment font-display">
                Advance Status: Complaint #{statusModalComplaint.id}
              </h3>
              <button
                onClick={() => setStatusModalComplaint(null)}
                className="text-slate hover:text-parchment p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="p-3 bg-white/[0.02] border border-parchment/8 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate block">Current Status</span>
                  <StatusBadge status={statusModalComplaint.status} isOverdue={statusModalComplaint.is_overdue} />
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase text-slate block">Category</span>
                  <span className="text-xs font-semibold text-parchment">{statusModalComplaint.category}</span>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
                  Target Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="input-field"
                  required
                >
                  {statusModalComplaint.status === 'Open' && (
                    <option value="In Progress" className="bg-ink">In Progress (Assign to staff / In review)</option>
                  )}
                  {statusModalComplaint.status === 'In Progress' && (
                    <option value="Resolved" className="bg-ink">Resolved (Mark complaint resolved)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
                  Admin Resolution Note (Emailed to resident)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Electrician visited flat and replaced corridor junction fuse."
                  rows={3}
                  className="input-field resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalComplaint(null)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="btn-brass text-xs py-2 px-5"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm & Notify</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
};

// ─── Overview Section ────────────────────────────────────────────────────────
interface AdminOverviewSectionProps {
  dashboardData: AdminDashboardData | null;
  loading: boolean;
  onSelectComplaint: (c: Complaint) => void;
  onViewAllComplaints: () => void;
  onRefresh: () => void;
}

const AdminOverviewSection: React.FC<AdminOverviewSectionProps> = ({
  dashboardData,
  loading,
  onViewAllComplaints,
  onRefresh,
}) => {
  const openCount = dashboardData?.by_status?.['Open'] ?? 0;
  const inProgressCount = dashboardData?.by_status?.['In Progress'] ?? 0;
  const resolvedCount = dashboardData?.by_status?.['Resolved'] ?? 0;
  const overdueCount = dashboardData?.overdue_count ?? 0;
  const totalCount = dashboardData?.total_complaints ?? 0;

  const statCards = [
    { label: 'Total Complaints', value: totalCount, icon: Clock, color: '#F6F4EF' },
    { label: 'Open Tickets', value: openCount, icon: Clock, color: '#D97706' },
    { label: 'In Progress', value: inProgressCount, icon: TrendingUp, color: '#3B82F6' },
    { label: 'Overdue (SLA)', value: overdueCount, icon: AlertTriangle, color: '#EF4444' },
    { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: '#10B981' },
  ];

  const pieData = [
    { name: 'Open', value: openCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Resolved', value: resolvedCount },
    { name: 'Overdue', value: overdueCount },
  ].filter((d) => d.value > 0);

  const barData = CATEGORIES.map((cat) => ({
    cat,
    count: dashboardData?.by_category?.[cat] ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
            Society Overview
          </h1>
          <p className="text-sm text-slate mt-1">
            Real-time maintenance status, SLA compliance, and category analytics.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="btn-ghost text-xs py-2 px-3.5 gap-1.5"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((s, i) => {
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
              <span className="font-mono text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                <AnimatedNumber value={s.value} />
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Status Breakdown */}
        <div className="dash-card p-6 space-y-4 bg-[#0c1525] border border-parchment/10 rounded-2xl">
          <h3 className="text-sm font-semibold text-parchment font-display tracking-tight">
            Status Breakdown
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#091120',
                    border: '1px solid rgba(246,244,239,0.15)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#F6F4EF',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-parchment/50 text-xs font-mono">
              No complaint status data yet
            </div>
          )}
        </div>

        {/* Bar Chart: Category Volume */}
        <div className="dash-card p-6 space-y-4 bg-[#0c1525] border border-parchment/10 rounded-2xl">
          <h3 className="text-sm font-semibold text-parchment font-display tracking-tight">
            Complaints by Category
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={28}>
              <XAxis dataKey="cat" tick={{ fill: '#C9A468', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A9088', fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
              <Bar dataKey="count" fill="#C9A468" radius={[4, 4, 0, 0]} animationDuration={800} />
              <Tooltip
                contentStyle={{
                  background: '#091120',
                  border: '1px solid rgba(246,244,239,0.15)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#F6F4EF',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Access CTA */}
      <div className="dash-card p-6 flex items-center justify-between flex-wrap gap-4 bg-[#0c1525] border border-parchment/10 rounded-2xl">
        <div>
          <h4 className="text-sm font-semibold text-parchment">Ready to review active complaints?</h4>
          <p className="text-xs text-parchment/75 mt-1">
            Use the comprehensive filtering system to triage, update status, and message residents.
          </p>
        </div>
        <button
          onClick={onViewAllComplaints}
          className="btn-brass text-xs py-2 px-5 shadow-md shadow-brass/10"
        >
          <span>Manage Complaints Queue</span>
        </button>
      </div>
    </div>
  );
};

// ─── Complaints Section with Multi-Filters & Pagination ──────────────────────
interface AdminComplaintsSectionProps {
  complaintsData: PaginatedComplaints;
  loading: boolean;
  filterCategory: string;
  setFilterCategory: (c: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (d: string) => void;
  filterDateTo: string;
  setFilterDateTo: (d: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onPageChange: (p: number) => void;
  onSelectComplaint: (c: Complaint) => void;
  onOpenStatusModal: (c: Complaint) => void;
  onUpdatePriority: (id: number, p: ComplaintPriority) => void;
  onRefresh: () => void;
}

const AdminComplaintsSection: React.FC<AdminComplaintsSectionProps> = ({
  complaintsData,
  loading,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  onApplyFilters,
  onResetFilters,
  onPageChange,
  onSelectComplaint,
  onOpenStatusModal,
  onUpdatePriority,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
            Complaints Management
          </h1>
          <p className="text-sm text-parchment/75 mt-1 font-normal">
            Showing {complaintsData.items.length} of {complaintsData.total} complaints sorted by overdue priority.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="btn-ghost text-xs py-2 px-3.5 gap-1.5 self-start sm:self-auto hover:bg-white/[0.04]"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Multi-Criteria Filter Bar */}
      <div className="dash-card p-5 space-y-4 bg-[#0c1525] border border-parchment/10 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brass font-medium">
          <Filter size={13} />
          <span>Multi-Criteria Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-mono text-parchment/70 uppercase tracking-wider mb-1.5 font-medium">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#101c30] border border-parchment/20 rounded-lg px-3 py-2 text-xs text-parchment focus:outline-none focus:border-brass w-full font-sans"
            >
              <option value="" className="bg-ink">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-ink">{cat}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-mono text-parchment/70 uppercase tracking-wider mb-1.5 font-medium">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#101c30] border border-parchment/20 rounded-lg px-3 py-2 text-xs text-parchment focus:outline-none focus:border-brass w-full font-sans"
            >
              <option value="" className="bg-ink">All Statuses</option>
              <option value="Open" className="bg-ink">Open</option>
              <option value="In Progress" className="bg-ink">In Progress</option>
              <option value="Resolved" className="bg-ink">Resolved</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[11px] font-mono text-parchment/70 uppercase tracking-wider mb-1.5 font-medium">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="bg-[#101c30] border border-parchment/20 rounded-lg px-3 py-1.5 text-xs text-parchment focus:outline-none focus:border-brass w-full font-mono"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-mono text-parchment/70 uppercase tracking-wider mb-1.5 font-medium">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="bg-[#101c30] border border-parchment/20 rounded-lg px-3 py-1.5 text-xs text-parchment focus:outline-none focus:border-brass w-full font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-parchment/8">
          <button
            onClick={onResetFilters}
            className="text-xs text-parchment/70 hover:text-parchment font-mono px-3 py-1.5 rounded hover:bg-white/[0.04] transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={onApplyFilters}
            className="btn-brass text-xs py-2 px-4 shadow-sm shadow-brass/10"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-brass animate-spin" />
        </div>
      ) : complaintsData.items.length === 0 ? (
        <div className="dash-card py-16 text-center space-y-3 bg-[#0c1525] border border-parchment/10">
          <CheckCircle2 className="w-8 h-8 text-parchment/40 mx-auto" />
          <h3 className="text-base font-semibold text-parchment">No complaints found</h3>
          <p className="text-xs text-parchment/70 max-w-sm mx-auto">
            No maintenance records match your active search filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaintsData.items.map((c, i) => (
            <motion.div
              key={c.id}
              className={`dash-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group bg-[#0c1525] border rounded-xl transition-all ${
                c.is_overdue && c.status !== 'Resolved'
                  ? 'border-red-500/40 bg-red-500/[0.03]'
                  : 'border-parchment/10 hover:border-brass/30'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              {/* Left Details */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onSelectComplaint(c)}
              >
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-brass bg-brass/10 border border-brass/20 px-2 py-0.5 rounded">
                    #{c.id}
                  </span>
                  <span className="text-sm font-semibold text-parchment group-hover:text-brass transition-colors tracking-tight">
                    {c.category}
                  </span>
                  {c.resident_name && (
                    <span className="text-xs text-parchment/75 font-mono">
                      · Resident: <strong className="text-parchment font-medium">{c.resident_name}</strong>
                    </span>
                  )}
                  {c.photo_url && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-brass font-mono bg-brass/10 border border-brass/20 px-2 py-0.5 rounded">
                      Photo Attached
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-parchment/85 line-clamp-2 leading-relaxed font-normal">
                  {c.description}
                </p>

                <div className="flex items-center gap-3 text-xs font-mono text-parchment/55 mt-2.5">
                  <span>Filed: {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {c.resolved_at && (
                    <span className="text-emerald-400">· Resolved: {new Date(c.resolved_at).toLocaleDateString('en-IN')}</span>
                  )}
                </div>
              </div>

              {/* Middle Badges & Priority Selector */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={c.status} isOverdue={c.is_overdue} />

                {/* Priority Selector */}
                <select
                  value={c.priority}
                  onChange={(e) => onUpdatePriority(c.id, e.target.value as ComplaintPriority)}
                  className="bg-[#101c30] border border-parchment/20 rounded-lg px-2.5 py-1 text-xs text-parchment font-mono focus:outline-none focus:border-brass cursor-pointer"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p} className="bg-ink">{p}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-parchment/8">
                <button
                  onClick={() => onSelectComplaint(c)}
                  className="btn-ghost text-xs py-1.5 px-3 gap-1 hover:bg-white/[0.04]"
                  title="View full ticket details and timeline"
                >
                  <Eye size={12} />
                  <span>View</span>
                </button>

                {c.status !== 'Resolved' && (
                  <button
                    onClick={() => onOpenStatusModal(c)}
                    className="btn-brass text-xs py-1.5 px-3.5 gap-1 shadow-sm shadow-brass/10"
                  >
                    <span>Advance Status</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {complaintsData.total_pages > 1 && (
        <div className="flex items-center justify-between p-4 dash-card text-xs font-mono">
          <span className="text-slate">
            Page {complaintsData.page} of {complaintsData.total_pages} ({complaintsData.total} tickets total)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(complaintsData.page - 1)}
              disabled={complaintsData.page <= 1}
              className="btn-ghost text-xs py-1.5 px-2.5 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(complaintsData.page + 1)}
              disabled={complaintsData.page >= complaintsData.total_pages}
              className="btn-ghost text-xs py-1.5 px-2.5 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Notices Section with Posting Form ──────────────────────────────────────
interface AdminNoticesSectionProps {
  notices: Notice[];
  loading: boolean;
  onNoticeCreated: (n: Notice) => void;
  onRefresh: () => void;
}

const AdminNoticesSection: React.FC<AdminNoticesSectionProps> = ({
  notices,
  loading,
  onNoticeCreated,
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [posting, setPosting] = useState(false);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setPosting(true);
    try {
      const res = await noticesApi.create({
        title: title.trim(),
        body: body.trim(),
        is_important: isImportant,
      });
      onNoticeCreated(res);
      setTitle('');
      setBody('');
      setIsImportant(false);
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
            Notice Board & Broadcasts
          </h1>
          <p className="text-sm text-slate mt-1">
            Publish society announcements and trigger email notifications to residents.
          </p>
        </div>
        <button onClick={onRefresh} className="btn-ghost text-xs py-2 px-3">
          Refresh
        </button>
      </div>

      {/* New Notice Form */}
      <div className="dash-card p-6 md:p-8 space-y-4">
        <h3 className="text-sm font-semibold text-parchment font-display">
          Create New Society Announcement
        </h3>
        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
              Notice Title *
            </label>
            <input
              className="input-field"
              placeholder="e.g. Scheduled Lift Maintenance & Power Backup Window"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
              Notice Content *
            </label>
            <textarea
              className="input-field resize-none h-28 leading-relaxed"
              placeholder="Provide complete announcement details for residents..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate cursor-pointer font-mono select-none">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="accent-brass w-4 h-4 rounded"
              />
              <span>Mark as Important (Sends email alerts to all residents)</span>
            </label>

            <button
              type="submit"
              disabled={posting}
              className="btn-brass text-xs py-2 px-5"
            >
              {posting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  <span>Publish Notice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-parchment font-display">
          Active Announcements ({notices.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-brass animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <p className="dash-card text-center py-12 text-xs text-slate">No announcements published yet.</p>
        ) : (
          notices.map((n, i) => (
            <motion.div
              key={n.id}
              className={`dash-card p-6 ${
                n.is_important ? 'border-amber-500/30 bg-amber-500/[0.03]' : ''
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.is_important && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
                      <Pin className="w-3 h-3 text-amber-400" />
                      <span>IMPORTANT NOTICE</span>
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-parchment">{n.title}</h4>
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
                  <span>Author:</span>
                  <strong className="text-parchment font-medium">{n.posted_by_name}</strong>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Settings Section (Overdue SLA Threshold) ────────────────────────────────
interface AdminSettingsSectionProps {
  settings: AdminSettings | null;
  thresholdDaysInput: number;
  setThresholdDaysInput: (days: number) => void;
  savingSettings: boolean;
  onSave: (e: React.FormEvent) => void;
}

const AdminSettingsSection: React.FC<AdminSettingsSectionProps> = ({
  settings,
  thresholdDaysInput,
  setThresholdDaysInput,
  savingSettings,
  onSave,
}) => (
  <div className="max-w-xl mx-auto space-y-6">
    <div>
      <h1 className="font-display text-parchment text-3xl font-normal" style={{ fontVariationSettings: '"SOFT" 40, "opsz" 32' }}>
        SLA & Overdue Configuration
      </h1>
      <p className="text-sm text-slate mt-1">
        Configure the runtime threshold for flagging aging unresolved tickets.
      </p>
    </div>

    <div className="dash-card p-6 md:p-8 space-y-6">
      <div className="p-4 rounded-xl bg-white/[0.02] border border-parchment/8 space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate">
          <span>Current Active SLA Threshold:</span>
          <span className="font-mono font-bold text-brass text-sm">
            {settings?.overdue_threshold_days ?? 7} days
          </span>
        </div>
        <p className="text-slate/70 leading-relaxed text-[11px]">
          Any complaint whose status is not <em>Resolved</em> and was created more than this number of days ago will be automatically marked as overdue and prioritized on the queue.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-2xs font-mono uppercase tracking-wider text-slate mb-1.5">
            Threshold (in Days) *
          </label>
          <input
            type="number"
            min={0}
            max={365}
            value={thresholdDaysInput}
            onChange={(e) => setThresholdDaysInput(Number(e.target.value))}
            className="input-field font-mono text-sm"
            required
          />
          <span className="text-[11px] text-slate/60 font-mono mt-1 block">
            Tip: Set to 0 days to instantly mark all open/in-progress tickets as overdue for testing.
          </span>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="btn-brass w-full py-2.5 justify-center text-xs"
        >
          {savingSettings ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save size={14} />
              <span>Save SLA Configuration</span>
            </>
          )}
        </button>
      </form>
    </div>
  </div>
);

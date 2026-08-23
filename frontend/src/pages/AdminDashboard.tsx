import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { adminApi, complaintsApi, noticesApi } from '../api/client';
import {
  AdminDashboardData,
  AdminSettings,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Notice,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  TableProperties,
  Bell,
  Settings as SettingsIcon,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  PlayCircle,
  PlusCircle,
  Pin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Send,
  Save,
  RefreshCw,
  X,
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

const STATUSES: ComplaintStatus[] = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High'];

const PIE_COLORS: Record<string, string> = {
  Open: '#64748b', // Slate
  'In Progress': '#38bdf8', // Sky
  Resolved: '#34d399', // Emerald
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'complaints' | 'notices' | 'settings'>('metrics');

  // Dashboard metrics state
  const [metrics, setMetrics] = useState<AdminDashboardData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);

  // Complaints table state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [totalComplaints, setTotalComplaints] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(true);

  // Filters state
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Status modal state
  const [statusModalComplaint, setStatusModalComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Notice creation state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState<boolean>(true);
  const [noticeTitle, setNoticeTitle] = useState<string>('');
  const [noticeBody, setNoticeBody] = useState<string>('');
  const [noticeIsImportant, setNoticeIsImportant] = useState<boolean>(false);
  const [postingNotice, setPostingNotice] = useState<boolean>(false);

  // Settings state
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [thresholdDaysInput, setThresholdDaysInput] = useState<number>(7);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Detail Modal state
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);

  const fetchDashboardMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const data = await adminApi.getDashboard();
      setMetrics(data);
    } catch {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterDateFrom) params.date_from = new Date(filterDateFrom).toISOString();
      if (filterDateTo) params.date_to = new Date(filterDateTo).toISOString();

      const data = await adminApi.getComplaints(params);
      setComplaints(data.items);
      setTotalComplaints(data.total);
      setTotalPages(data.total_pages);
    } catch {
      toast.error('Failed to load complaints table.');
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

  const fetchSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      setSettings(data);
      setThresholdDaysInput(data.overdue_threshold_days);
    } catch {
      toast.error('Failed to load admin settings.');
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
    fetchComplaints();
    fetchNotices();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, pageSize, filterCategory, filterStatus, filterDateFrom, filterDateTo]);

  // Handle Status Update
  const handleOpenStatusModal = (complaint: Complaint) => {
    setStatusModalComplaint(complaint);
    if (complaint.status === 'Open') {
      setNewStatus('In Progress');
    } else if (complaint.status === 'In Progress') {
      setNewStatus('Resolved');
    } else {
      setNewStatus('Resolved');
    }
    setStatusNote('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalComplaint) return;

    setUpdatingStatus(true);
    try {
      await complaintsApi.updateStatus(statusModalComplaint.id, newStatus, statusNote);
      toast.success(`Complaint #${statusModalComplaint.id} status updated to ${newStatus}`);
      setStatusModalComplaint(null);
      await fetchComplaints();
      await fetchDashboardMetrics();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to update complaint status.';
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Priority Update
  const handleUpdatePriority = async (complaintId: number, newPriority: string) => {
    try {
      await complaintsApi.updatePriority(complaintId, newPriority);
      toast.success(`Complaint #${complaintId} priority set to ${newPriority}`);
      await fetchComplaints();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to update priority.';
      toast.error(message);
    }
  };

  // Handle Notice Post
  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      toast.error('Please enter both a notice title and body.');
      return;
    }

    setPostingNotice(true);
    try {
      await noticesApi.create({
        title: noticeTitle.trim(),
        body: noticeBody.trim(),
        is_important: noticeIsImportant,
      });
      toast.success(
        noticeIsImportant
          ? 'Important notice posted! Notification emails dispatched to all residents.'
          : 'Notice posted successfully!'
      );
      setNoticeTitle('');
      setNoticeBody('');
      setNoticeIsImportant(false);
      await fetchNotices();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to post notice.';
      toast.error(message);
    } finally {
      setPostingNotice(false);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (thresholdDaysInput < 0 || thresholdDaysInput > 365) {
      toast.error('Threshold days must be between 0 and 365.');
      return;
    }

    setSavingSettings(true);
    try {
      const updated = await adminApi.updateSettings(thresholdDaysInput);
      setSettings(updated);
      toast.success(`Overdue threshold updated to ${updated.overdue_threshold_days} days!`);
      await fetchDashboardMetrics();
      await fetchComplaints();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to update settings.';
      toast.error(message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleViewDetails = async (complaintId: number) => {
    try {
      const details = await complaintsApi.getById(complaintId);
      setDetailComplaint(details);
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

  // Chart data formatting
  const statusPieData = metrics
    ? Object.entries(metrics.by_status).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const categoryBarData = metrics
    ? Object.entries(metrics.by_category).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'metrics'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'complaints'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>Complaints Management</span>
            </button>

            <button
              onClick={() => setActiveTab('notices')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'notices'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notice Board</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchDashboardMetrics();
              fetchComplaints();
              fetchNotices();
              fetchSettings();
              toast.success('Data refreshed');
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition-colors shrink-0"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: DASHBOARD & ANALYTICS */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Total Complaints</span>
                  <FileText className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-3xl font-bold text-slate-100">
                  {metrics?.total_complaints ?? '-'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Logged across all time</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Open</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-bold text-slate-200">
                  {metrics?.by_status?.Open ?? '-'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Pending initial review</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider">In Progress</span>
                  <PlayCircle className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-3xl font-bold text-sky-400">
                  {metrics?.by_status?.['In Progress'] ?? '-'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Assigned / working</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Resolved</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  {metrics?.by_status?.Resolved ?? '-'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Completed & closed</p>
              </div>

              {/* Prominent Overdue Count Card */}
              <div className="bg-gradient-to-br from-rose-950/40 to-slate-900/80 border-2 border-rose-500/40 rounded-2xl p-5 shadow-lg shadow-rose-950/20">
                <div className="flex items-center justify-between text-rose-400 mb-2 text-xs">
                  <span className="font-bold uppercase tracking-wider">Overdue Complaints</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                </div>
                <div className="text-3xl font-bold text-rose-300">
                  {metrics?.overdue_count ?? '-'}
                </div>
                <p className="text-xs text-rose-400/80 mt-1 font-medium">
                  &gt; {settings?.overdue_threshold_days ?? 7} days old (unresolved)
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Breakdown Pie Chart */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-100">Complaints by Status</h3>
                  <p className="text-xs text-slate-400">Current distribution of ticket states</p>
                </div>
                <div className="h-64 w-full">
                  {loadingMetrics ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : statusPieData.every((d) => d.value === 0) ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                      No complaint data to display
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={45}
                          paddingAngle={4}
                          label={({ name, percent }: any) =>
                            percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                          labelLine={false}
                        >
                          {statusPieData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name] || '#64748b'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '0.75rem',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Category Breakdown Bar Chart */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-100">Complaints by Category</h3>
                  <p className="text-xs text-slate-400">Ticket frequency across domains</p>
                </div>
                <div className="h-64 w-full">
                  {loadingMetrics ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : categoryBarData.every((d) => d.count === 0) ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                      No category data to display
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <XAxis
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={11}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                        />
                        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '0.75rem',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" name="Tickets" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLAINTS MANAGEMENT TABLE */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>Filters & Search</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Category filter */}
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date from */}
                <div>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="From Date"
                  />
                </div>

                {/* Date to */}
                <div>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="To Date"
                  />
                </div>

                {/* Reset Filters */}
                <div>
                  <button
                    onClick={() => {
                      setFilterCategory('');
                      setFilterStatus('');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Complaints Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Resident</th>
                      <th className="py-3.5 px-4">Category & Description</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Created</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loadingComplaints ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                          <span>Loading complaints...</span>
                        </td>
                      </tr>
                    ) : complaints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No complaints found matching the criteria.
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr
                          key={c.id}
                          className={`transition-colors hover:bg-slate-800/40 ${
                            c.is_overdue && c.status !== 'Resolved'
                              ? 'border-l-4 border-l-rose-500 bg-rose-950/10'
                              : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-sky-400 font-semibold">
                            #{c.id}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-200">
                            {c.resident_name || `Resident #${c.resident_id}`}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-200 text-xs mb-0.5">
                              {c.category}
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-xs">
                              {c.description}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={c.status} isOverdue={c.is_overdue} size="sm" />
                          </td>
                          <td className="py-3.5 px-4">
                            {/* Inline Priority Selector */}
                            <select
                              value={c.priority}
                              onChange={(e) => handleUpdatePriority(c.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                            >
                              {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                            {formatDate(c.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            {/* Update Status Button */}
                            {c.status !== 'Resolved' ? (
                              <button
                                onClick={() => handleOpenStatusModal(c)}
                                className="text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-lg transition-colors font-medium"
                              >
                                Advance Status
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Resolved (Locked)</span>
                            )}

                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewDetails(c.id)}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition-colors inline-flex items-center"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span>
                    Showing {complaints.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                    {Math.min(currentPage * pageSize, totalComplaints)} of {totalComplaints} items
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-300"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTICE BOARD POSTING & LIST */}
        {activeTab === 'notices' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Notice Form */}
            <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">Publish Notice</h3>
              </div>
              <p className="text-xs text-slate-400">
                Broadcast announcements or emergencies to all residents.
              </p>

              <form onSubmit={handlePostNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Water Tank Maintenance Notice"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Notice Body *
                  </label>
                  <textarea
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                    placeholder="Provide complete notice details..."
                    rows={5}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                    required
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="isImportantCheckbox"
                    checked={noticeIsImportant}
                    onChange={(e) => setNoticeIsImportant(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <label htmlFor="isImportantCheckbox" className="text-xs text-slate-300 cursor-pointer">
                    <strong className="text-amber-400 font-semibold block">Mark as Important Announcement</strong>
                    Pins notice to the top and automatically sends notification emails to all residents in background.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={postingNotice}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 text-xs"
                >
                  {postingNotice ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish Notice</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Existing Notices List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100">Society Notice Board</h3>
                <span className="text-xs text-slate-500 font-mono">{notices.length} notices</span>
              </div>

              {loadingNotices ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                  <span>Loading notices...</span>
                </div>
              ) : notices.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                  No notices published yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {notices.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-2xl p-5 transition-all ${
                        n.is_important
                          ? 'bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/80 border-2 border-amber-500/40 shadow-md shadow-amber-500/5'
                          : 'bg-slate-900/60 border border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {n.is_important && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase tracking-wider">
                              <Pin className="w-3 h-3 text-amber-400" />
                              <span>PINNED</span>
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-slate-100">{n.title}</h4>
                        </div>
                        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                          {formatDate(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {n.body}
                      </p>
                      {n.posted_by_name && (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          Author: <strong className="text-slate-300 font-medium">{n.posted_by_name}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS PANEL */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-sky-400" />
                <span>Overdue Threshold Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure runtime threshold for flagging unresolved complaints as overdue.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Current Active Threshold:</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    {settings?.overdue_threshold_days ?? 7} days
                  </span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Any complaint whose status is not <em>Resolved</em> and was created more than this number of days ago will be highlighted as overdue and prioritized on the admin table.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Threshold (in Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={thresholdDaysInput}
                  onChange={(e) => setThresholdDaysInput(Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tip: Set to 0 days to instantly mark all unresolved tickets as overdue for testing.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 text-sm"
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Threshold Setting</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Advance Status Modal */}
      {statusModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                Update Complaint #{statusModalComplaint.id}
              </h3>
              <button
                onClick={() => setStatusModalComplaint(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Current Status
                </label>
                <div className="text-sm font-semibold text-slate-200">
                  {statusModalComplaint.status}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {statusModalComplaint.status === 'Open' && (
                    <option value="In Progress">In Progress (Assign to staff)</option>
                  )}
                  {statusModalComplaint.status === 'In Progress' && (
                    <option value="Resolved">Resolved (Complete ticket)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Note (Optional - emailed to resident)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Electrician visited flat A-402 and replaced corridor fuse."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalComplaint(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium rounded-xl flex items-center space-x-1.5"
                >
                  {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Update Status</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={detailComplaint}
        onClose={() => setDetailComplaint(null)}
      />
    </div>
  );
};

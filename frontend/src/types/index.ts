export type UserRole = 'resident' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  flat_no?: string | null;
  flat_number?: string | null;
  created_at: string;
}

export type ComplaintCategory = 'Plumbing' | 'Electrical' | 'Cleanliness' | 'Security' | 'Parking' | 'Other';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved';
export type ComplaintPriority = 'Low' | 'Medium' | 'High';

export interface ComplaintStatusHistory {
  id: number;
  complaint_id: number;
  old_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  changed_by: number | null;
  changed_by_name: string | null;
  note: string | null;
  changed_at: string;
}

export interface Complaint {
  id: number;
  resident_id: number;
  resident_name?: string | null;
  category: ComplaintCategory;
  description: string;
  photo_url?: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  is_overdue: boolean;
  created_at: string;
  resolved_at?: string | null;
  updated_at: string;
  history?: ComplaintStatusHistory[];
}

export interface PaginatedComplaints {
  items: Complaint[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Notice {
  id: number;
  title: string;
  body: string;
  is_important: boolean;
  posted_by: number;
  posted_by_name?: string | null;
  created_at: string;
}

export interface AdminDashboardData {
  total_complaints: number;
  by_status: Record<ComplaintStatus, number>;
  by_category: Record<ComplaintCategory, number>;
  overdue_count: number;
}

export interface AdminSettings {
  overdue_threshold_days: number;
}

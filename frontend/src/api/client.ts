import axios from 'axios';
import {
  AdminDashboardData,
  AdminSettings,
  Complaint,
  Notice,
  PaginatedComplaints,
  User,
} from '../types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
});

// Request interceptor: attach token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('society_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('society_token');
      localStorage.removeItem('society_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API services
export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { email: string; password: string; name: string; role: string }): Promise<User> => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await client.get('/auth/me');
    return res.data;
  },
};

export const complaintsApi = {
  create: async (formData: FormData): Promise<Complaint> => {
    const res = await client.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getMyComplaints: async (): Promise<Complaint[]> => {
    const res = await client.get('/complaints/me');
    return res.data;
  },
  getById: async (id: number): Promise<Complaint> => {
    const res = await client.get(`/complaints/${id}`);
    return res.data;
  },
  updateStatus: async (id: number, new_status: string, note?: string): Promise<Complaint> => {
    const res = await client.patch(`/complaints/${id}/status`, {
      new_status,
      note: note || undefined,
    });
    return res.data;
  },
  updatePriority: async (id: number, priority: string): Promise<Complaint> => {
    const res = await client.patch(`/complaints/${id}/priority`, { priority });
    return res.data;
  },
};

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await client.get('/admin/dashboard');
    return res.data;
  },
  getComplaints: async (params: {
    category?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedComplaints> => {
    const res = await client.get('/admin/complaints', { params });
    return res.data;
  },
  getSettings: async (): Promise<AdminSettings> => {
    const res = await client.get('/admin/settings');
    return res.data;
  },
  updateSettings: async (overdue_threshold_days: number): Promise<AdminSettings> => {
    const res = await client.patch('/admin/settings', { overdue_threshold_days });
    return res.data;
  },
};

export const noticesApi = {
  getAll: async (): Promise<Notice[]> => {
    const res = await client.get('/notices');
    return res.data;
  },
  create: async (data: { title: string; body: string; is_important: boolean }): Promise<Notice> => {
    const res = await client.post('/notices', data);
    return res.data;
  },
};

export default client;

import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'member';
  avatar: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  uniqueCode: string;
  isDummy?: boolean;
  password?: string; // Added for local auth simulation
}

export interface Payment {
  memberId: string;
  month: number;
  status: 'paid' | 'pending' | 'late';
  paidDate?: string;
}

export interface Kuri {
  id: string;
  name: string;
  monthlyAmount: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  type: 'new' | 'existing';
  description: string;
  duration: string;
  startDate: string;
  kuriTakenDate: string;
  memberIds: string[];
  adminId?: string;
  createdBy?: string;
  payments?: Payment[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
}

export interface RevenueData {
  name: string;
  revenue: number;
  users: number;
}
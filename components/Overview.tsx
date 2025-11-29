import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, Briefcase } from 'lucide-react';
import { MOCK_REVENUE_DATA } from '../constants';
import { USERS_STORAGE_KEY, KURIS_STORAGE_KEY } from '../constants';
import { User, Kuri } from '../types';

import { MemberDashboard } from './MemberDashboard';

interface OverviewProps {
  currentUser?: User;
}

export const Overview: React.FC<OverviewProps> = ({ currentUser }) => {
  // If user is a member, show the new Member Dashboard
  if (currentUser && currentUser.role === 'member') {
    return <MemberDashboard user={currentUser} />;
  }

  // Get counts from local storage
  const [users, setUsers] = React.useState<User[]>([]);
  const [kuris, setKuris] = React.useState<Kuri[]>([]);

  React.useEffect(() => {
    try {
      const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (savedUsers) setUsers(JSON.parse(savedUsers));

      const savedKuris = localStorage.getItem(KURIS_STORAGE_KEY);
      if (savedKuris) setKuris(JSON.parse(savedKuris));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const activeKurisCount = kuris.filter(k => k.status === 'active').length;
  // Fallback to empty array if users is undefined/null to prevent crash
  const safeUsers = users || [];
  const totalRevenue = kuris.reduce((acc, curr) => acc + (curr.monthlyAmount * curr.memberIds.length), 0);

  const stats = [
    { label: 'Est. Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, change: 12.5, trend: 'up', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Total Users', value: safeUsers.length.toString(), change: 8.2, trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Kuris', value: activeKurisCount.toString(), change: 2, trend: 'up', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Total Schemes', value: kuris.length.toString(), change: 4.1, trend: 'neutral', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening with your application today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-lg p-3 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-slate-500">{stat.label}</dt>
                    <dd>
                      <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3">
              <div className="text-sm">
                <span className={`font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {stat.trend === 'up' ? '+' : ''}{stat.change}%
                </span>
                <span className="text-slate-500"> from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Analytics</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Partial) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Recent Kuris</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Members</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {kuris.length > 0 ? kuris.slice(0, 3).map((kuri) => (
                <tr key={kuri.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{kuri.name}</div>
                        <div className="text-xs text-slate-500">{kuri.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-900">${kuri.monthlyAmount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${kuri.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}
                    `}>
                      {kuri.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {kuri.memberIds.length}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No Kuris created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
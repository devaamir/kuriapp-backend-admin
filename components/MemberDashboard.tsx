import React, { useState, useEffect } from 'react';
import { Search, Wallet, Briefcase, Calendar, ChevronRight } from 'lucide-react';
import { User, Kuri } from '../types';

interface MemberDashboardProps {
    user: User;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ user }) => {
    const [kuris, setKuris] = useState<Kuri[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'my_groups'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchKuris();
    }, [user.id]);

    const fetchKuris = async () => {
        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
            // Fetch user specific kuris
            const response = await fetch(`${API_BASE_URL}/kuris?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setKuris(data);
            }
        } catch (error) {
            console.error('Failed to fetch kuris:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredKuris = kuris.filter(k => {
        const matchesSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'active') return k.status === 'active';
        if (filter === 'my_groups') return k.memberIds.includes(user.id);
        return true;
    });

    const totalSavings = kuris.reduce((acc, k) => {
        // Mock calculation: monthlyAmount * 2 months
        return acc + (k.monthlyAmount * 2);
    }, 0);

    const activeGroupsCount = kuris.filter(k => k.status === 'active').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">Track your savings and manage your chit funds.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Find New Schemes
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 rounded-lg p-3 bg-indigo-100">
                                <Wallet className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-slate-500">Total Savings</dt>
                                    <dd>
                                        <div className="text-lg font-bold text-slate-900">₹{totalSavings.toLocaleString()}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 rounded-lg p-3 bg-emerald-100">
                                <Briefcase className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-slate-500">Active Groups</dt>
                                    <dd>
                                        <div className="text-lg font-bold text-slate-900">{activeGroupsCount}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 rounded-lg p-3 bg-amber-100">
                                <Calendar className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-slate-500">Next Payment</dt>
                                    <dd>
                                        <div className="text-lg font-bold text-slate-900">Dec 10, 2025</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200">
                    {(['all', 'active', 'my_groups'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === f
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search groups..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Kuri Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredKuris.map((kuri) => (
                    <div key={kuri.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{kuri.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{kuri.type}</p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${kuri.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}
                `}>
                                    {kuri.status}
                                </span>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Monthly</p>
                                    <p className="text-lg font-bold text-indigo-600">₹{kuri.monthlyAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Members</p>
                                    <p className="text-lg font-bold text-slate-900">{kuri.memberIds.length}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-6">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>Progress</span>
                                    <span className="font-medium text-indigo-600">17%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '17%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-xl flex justify-between items-center">
                            <span className="text-xs text-slate-500">Next: Dec 10</span>
                            <button
                                onClick={() => window.location.hash = `#/kuris/${kuri.id}`}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                            >
                                View Details <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredKuris.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No schemes found</h3>
                        <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Search, Wallet, Briefcase, Calendar, ChevronRight, Plus, X, DollarSign, Clock, UserPlus, Check, Bot } from 'lucide-react';
import { User, Kuri } from '../types';
import { Button } from './Button';
import { Input } from './Input';

interface MemberDashboardProps {
    user: User;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ user }) => {
    const [kuris, setKuris] = useState<Kuri[]>([]);
    const [users, setUsers] = useState<User[]>([]); // All users for selection
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'my_groups'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Create Kuri State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        monthlyAmount: '',
        description: '',
        duration: '',
        startDate: '',
        type: 'new'
    });

    const [editingKuri, setEditingKuri] = useState<Kuri | null>(null);

    // Member Selection State
    const [showMemberSelector, setShowMemberSelector] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    // Dummy User Creation State
    const [isDummyModalOpen, setIsDummyModalOpen] = useState(false);
    const [dummyName, setDummyName] = useState('');

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const fetchData = async () => {
        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
            const [kurisRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/kuris?userId=${user.id}`),
                fetch(`${API_BASE_URL}/users`)
            ]);

            if (kurisRes.ok) setKuris(await kurisRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateUniqueCode = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '#';
        for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
        for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        return code;
    };

    const handleOpenCreate = () => {
        setEditingKuri(null);
        setFormData({
            name: '',
            monthlyAmount: '',
            description: '',
            duration: '',
            startDate: new Date().toISOString().split('T')[0],
            type: 'new'
        });
        setSelectedMembers([user.id]); // Creator is always a member
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (kuri: Kuri) => {
        setEditingKuri(kuri);
        setFormData({
            name: kuri.name,
            monthlyAmount: kuri.monthlyAmount.toString(),
            description: kuri.description || '',
            duration: kuri.duration,
            startDate: kuri.startDate,
            type: kuri.type || 'new'
        });
        setSelectedMembers(kuri.memberIds);
        setIsCreateModalOpen(true);
    };

    const toggleMemberSelection = (userId: string) => {
        setSelectedMembers(prev => {
            const isRemoving = prev.includes(userId);
            const newMembers = isRemoving
                ? prev.filter(id => id !== userId)
                : [...prev, userId];
            return newMembers;
        });
    };

    const createDummyUser = async () => {
        if (!dummyName) return;

        const newDummy: User = {
            id: Date.now().toString(),
            name: dummyName,
            email: `${dummyName.toLowerCase().replace(/\s/g, '')}@dummy.local`,
            role: 'member',
            status: 'active',
            lastLogin: 'Never',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dummyName)}&background=random&color=fff`,
            uniqueCode: generateUniqueCode(),
            isDummy: true
        };

        // Optimistic update
        setUsers(prev => [newDummy, ...prev]);
        setSelectedMembers(prev => [...prev, newDummy.id]);
        setDummyName('');
        setIsDummyModalOpen(false);
    };

    const handleSubmitKuri = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
            const kuriData = {
                ...formData,
                monthlyAmount: Number(formData.monthlyAmount),
                status: editingKuri ? editingKuri.status : 'pending',
                type: formData.type,
                adminId: editingKuri ? editingKuri.adminId : user.id,
                memberIds: selectedMembers,
                createdBy: editingKuri ? editingKuri.createdBy : user.id
            };

            if (editingKuri) {
                const response = await fetch(`${API_BASE_URL}/kuris/${editingKuri.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kuriData)
                });

                if (response.ok) {
                    const updatedKuri = await response.json();
                    setKuris(prev => prev.map(k => k.id === editingKuri.id ? updatedKuri : k));
                    setIsCreateModalOpen(false);
                    alert('Kuri updated successfully!');
                }
            } else {
                const response = await fetch(`${API_BASE_URL}/kuris`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kuriData)
                });

                if (response.ok) {
                    const createdKuri = await response.json();
                    setKuris(prev => [createdKuri, ...prev]);
                    setIsCreateModalOpen(false);
                    alert('Kuri created successfully! Waiting for admin approval.');
                }
            }
        } catch (error) {
            console.error('Failed to save kuri:', error);
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
        return acc + (k.monthlyAmount * 2); // Mock calculation
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
                    <Button onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Scheme
                    </Button>
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
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Next: Dec 10</span>
                                {kuri.createdBy === user.id && (
                                    <button
                                        onClick={() => handleOpenEdit(kuri)}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
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
                        <p className="mt-1 text-sm text-slate-500">Create a new scheme to get started.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Kuri Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900">{editingKuri ? 'Edit Kuri Scheme' : 'Create New Kuri Scheme'}</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitKuri} className="flex flex-col md:flex-row">
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <Input
                                                label="Scheme Name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Office Savings 2024"
                                            />
                                        </div>
                                        <Input
                                            label="Type"
                                            name="type"
                                            as="select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="new">New Scheme</option>
                                            <option value="existing">Existing Scheme</option>
                                        </Input>
                                        <Input
                                            label="Monthly Amount"
                                            type="number"
                                            icon={DollarSign}
                                            value={formData.monthlyAmount}
                                            onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                                            placeholder="0.00"
                                        />
                                        <Input
                                            label="Duration"
                                            icon={Clock}
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            placeholder="e.g. 12 Months"
                                        />
                                        <Input
                                            label="Start Date"
                                            type="date"
                                            icon={Calendar}
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                        <div className="sm:col-span-2">
                                            <Input
                                                label="Description"
                                                as="textarea"
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Optional description..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Members Sidebar */}
                                <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 flex flex-col h-[600px] md:h-auto">
                                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                        <h4 className="font-medium text-slate-900">Members ({selectedMembers.length})</h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowMemberSelector(true)}
                                            className="text-xs flex items-center text-indigo-600 font-medium hover:text-indigo-800"
                                        >
                                            <UserPlus className="w-3 h-3 mr-1" /> Add
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {selectedMembers.map(memberId => {
                                            const member = users.find(u => u.id === memberId) || (memberId === user.id ? user : null);
                                            if (!member) return null;
                                            return (
                                                <div key={memberId} className="flex items-center bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                                                    <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-slate-900 truncate">{member.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{member.uniqueCode}</p>
                                                    </div>
                                                    {memberId !== user.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleMemberSelection(memberId)}
                                                            className="text-slate-400 hover:text-red-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-4 border-t border-slate-200">
                                        <Button type="submit" className="w-full">
                                            {editingKuri ? 'Save Changes' : 'Create Scheme'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Selector Modal */}
            {showMemberSelector && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 text-center">
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm" onClick={() => setShowMemberSelector(false)}></div>
                        <div className="inline-block bg-white rounded-xl shadow-xl transform transition-all max-w-md w-full overflow-hidden text-left">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h4 className="font-bold text-slate-900">Select Members</h4>
                                <button onClick={() => setShowMemberSelector(false)}><X className="w-5 h-5 text-slate-400" /></button>
                            </div>

                            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDummyModalOpen(true)}
                                    className="w-full flex items-center justify-center p-3 border-2 border-dashed border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Create & Add Dummy Member
                                </button>

                                {users.map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => toggleMemberSelection(u.id)}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedMembers.includes(u.id)
                                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                            : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="relative">
                                            <img src={u.avatar} alt="" className="w-8 h-8 rounded-full" />
                                            {u.isDummy && <div className="absolute -bottom-1 -right-1 bg-amber-100 rounded-full p-0.5"><Bot className="w-3 h-3 text-amber-600" /></div>}
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-slate-900">{u.name} {u.id === user.id && '(Me)'}</p>
                                            <p className="text-xs text-slate-500">{u.uniqueCode}</p>
                                        </div>
                                        {selectedMembers.includes(u.id) && <Check className="w-5 h-5 text-indigo-600" />}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <Button onClick={() => setShowMemberSelector(false)}>Done</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Dummy Member Modal */}
            {isDummyModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-slate-900/50" onClick={() => setIsDummyModalOpen(false)}></div>
                    <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-sm relative z-10">
                        <h4 className="text-lg font-bold mb-4">Create Dummy Member</h4>
                        <p className="text-sm text-slate-500 mb-4">This will create a placeholder user account.</p>
                        <Input
                            label="Member Name"
                            value={dummyName}
                            onChange={(e) => setDummyName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 mt-6">
                            <Button onClick={createDummyUser} disabled={!dummyName} className="flex-1">Create & Add</Button>
                            <Button onClick={() => setIsDummyModalOpen(false)} variant="secondary">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

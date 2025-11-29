import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, CheckCircle, AlertCircle, Edit2, Plus, X, Trash2, UserPlus, Check, Bot, ShieldCheck, BarChart2 } from 'lucide-react';
import { Kuri, User, Payment } from '../types';
import { Button } from './Button';
import { Input } from './Input';

interface KuriDetailsProps {
    currentUser?: User;
}

export const KuriDetails: React.FC<KuriDetailsProps> = ({ currentUser }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [kuri, setKuri] = useState<Kuri | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [members, setMembers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    // Admin Features State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showMemberSelector, setShowMemberSelector] = useState(false);
    const [formData, setFormData] = useState<Partial<Kuri>>({});
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    // Dummy User State
    const [isDummyModalOpen, setIsDummyModalOpen] = useState(false);
    const [dummyName, setDummyName] = useState('');

    const isAdmin = currentUser?.role === 'admin' || (kuri && (currentUser?.id === kuri.adminId || currentUser?.id === kuri.createdBy));

    const fetchData = async () => {
        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;

            const [kuriRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/kuris/${id}`),
                fetch(`${API_BASE_URL}/users`)
            ]);

            if (!kuriRes.ok) throw new Error('Kuri not found');

            const kuriData = await kuriRes.json();
            setKuri(kuriData);

            if (usersRes.ok) {
                const usersData: User[] = await usersRes.json();
                setAllUsers(usersData);
                const membersList = usersData.filter(u => kuriData.memberIds.includes(u.id));
                setMembers(membersList);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleOpenEdit = () => {
        if (!kuri) return;
        setFormData(kuri);
        setSelectedMembers(kuri.memberIds);
        setIsEditModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleMemberSelection = (userId: string) => {
        setSelectedMembers(prev => {
            const isRemoving = prev.includes(userId);
            return isRemoving ? prev.filter(id => id !== userId) : [...prev, userId];
        });
    };

    const generateUniqueCode = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '#';
        for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
        for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        return code;
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
        setAllUsers(prev => [newDummy, ...prev]);
        setSelectedMembers(prev => [...prev, newDummy.id]);
        setDummyName('');
        setIsDummyModalOpen(false);
    };

    const handleSaveKuri = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kuri || !formData.name) return;

        const updatedKuri = {
            ...formData,
            monthlyAmount: Number(formData.monthlyAmount),
            memberIds: selectedMembers,
        };

        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
            const response = await fetch(`${API_BASE_URL}/kuris/${kuri.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedKuri)
            });

            if (response.ok) {
                setIsEditModalOpen(false);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Failed to update kuri:', error);
        }
    };

    // Analytics Helpers
    const currentMonth = 2; // Mock current month
    const paidMembersCount = kuri?.payments?.filter(p => p.month === currentMonth && p.status === 'paid').length || 0;
    const totalExpected = (kuri?.monthlyAmount || 0) * (kuri?.memberIds.length || 0);
    const totalCollected = (kuri?.monthlyAmount || 0) * paidMembersCount;
    const collectionProgress = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !kuri) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">Error loading Kuri</h3>
                <p className="mt-1 text-sm text-slate-500">{error || 'Kuri not found'}</p>
                <button onClick={() => navigate(-1)} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </button>
                <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${kuri.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {kuri.status}
                    </span>
                    {isAdmin && (
                        <Button onClick={handleOpenEdit} size="sm" variant="secondary">
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Kuri
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100">
                    <h1 className="text-3xl font-bold text-slate-900">{kuri.name}</h1>
                    <p className="mt-2 text-slate-500">{kuri.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-6 text-center">
                        <div className="text-sm font-medium text-slate-500 mb-1">Monthly Amount</div>
                        <div className="text-3xl font-bold text-indigo-600">₹{kuri.monthlyAmount.toLocaleString()}</div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-sm font-medium text-slate-500 mb-1">Total Members</div>
                        <div className="text-3xl font-bold text-slate-900">{kuri.memberIds.length}</div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-sm font-medium text-slate-500 mb-1">Duration</div>
                        <div className="text-3xl font-bold text-slate-900">{kuri.duration || 12} <span className="text-sm font-normal text-slate-400">months</span></div>
                    </div>
                </div>
            </div>

            {/* Admin Analytics Section */}
            {isAdmin && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <BarChart2 className="h-5 w-5 mr-2 text-indigo-600" />
                        Collection Analytics (Month {currentMonth})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <div className="text-sm text-slate-500">Total Expected</div>
                            <div className="text-xl font-bold text-slate-900">₹{totalExpected.toLocaleString()}</div>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl">
                            <div className="text-sm text-emerald-600">Collected</div>
                            <div className="text-xl font-bold text-emerald-700">₹{totalCollected.toLocaleString()}</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-xl">
                            <div className="text-sm text-amber-600">Pending</div>
                            <div className="text-xl font-bold text-amber-700">₹{(totalExpected - totalCollected).toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-500">Collection Progress</span>
                        <span className="font-bold text-indigo-600">{Math.round(collectionProgress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6">
                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${collectionProgress}%` }}></div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-slate-900 mb-4">Member Payment Status</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {members.map(member => {
                                const isPaid = kuri.payments?.some(p => p.memberId === member.id && p.month === currentMonth && p.status === 'paid');
                                return (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center">
                                            <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-slate-900">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.uniqueCode}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {isPaid ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Paid
                                                </span>
                                            ) : (
                                                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full hover:bg-indigo-50">
                                                    Mark as Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schedule / Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                        Payment Schedule
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-emerald-500 mr-3" />
                                <div>
                                    <div className="text-sm font-medium text-slate-900">Month 1</div>
                                    <div className="text-xs text-slate-500">Paid on Nov 10, 2025</div>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">₹{kuri.monthlyAmount.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-lg shadow-sm">
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 text-indigo-500 mr-3" />
                                <div>
                                    <div className="text-sm font-medium text-slate-900">Month 2 (Current)</div>
                                    <div className="text-xs text-slate-500">Due by Dec 10, 2025</div>
                                </div>
                            </div>
                            {currentUser &&
                                currentUser.role !== 'admin' &&
                                kuri.adminId !== currentUser.id &&
                                kuri.createdBy !== currentUser.id && (
                                    <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                                        Pay Now
                                    </button>
                                )}
                        </div>

                        {[3, 4, 5].map(m => (
                            <div key={m} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg opacity-60">
                                <div className="flex items-center">
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-200 mr-3"></div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900">Month {m}</div>
                                        <div className="text-xs text-slate-500">Upcoming</div>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-slate-400">₹{kuri.monthlyAmount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info / Rules */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                        Scheme Information
                    </h3>
                    <div className="prose prose-sm text-slate-500">
                        <p>
                            This is a standard chit fund scheme. Members contribute a fixed amount every month for the duration of the scheme.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Payments are due by the 10th of every month.</li>
                            <li>Late payments may incur a penalty.</li>
                            <li>The prize money is auctioned every month.</li>
                            <li>The dividend is distributed equally among all non-prized subscribers.</li>
                        </ul>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900 mb-2">Admin Contact</h4>
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                A
                            </div>
                            <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">Admin Support</div>
                                <div className="text-xs text-slate-500">support@kuriapp.com</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    Members ({members.length})
                </h3>
                {members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                    <p className="text-xs text-slate-500">{member.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No members found.</p>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900">Edit Kuri</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveKuri} className="flex flex-col md:flex-row">
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <Input label="Kuri Name" name="name" required value={formData.name} onChange={handleInputChange} />
                                        </div>
                                        <Input label="Monthly Amount" name="monthlyAmount" type="number" icon={DollarSign} required value={formData.monthlyAmount} onChange={handleInputChange} />
                                        <Input label="Status" name="status" as="select" value={formData.status} onChange={handleInputChange}>
                                            <option value="pending">Pending</option>
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="rejected">Rejected</option>
                                        </Input>
                                        <Input label="Duration" name="duration" icon={Clock} value={formData.duration} onChange={handleInputChange} />
                                        <Input label="Start Date" name="startDate" type="date" icon={Calendar} value={formData.startDate} onChange={handleInputChange} />
                                        <div className="sm:col-span-2">
                                            <Input label="Description" name="description" as="textarea" rows={3} value={formData.description} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* Members Sidebar */}
                                <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 flex flex-col h-[600px] md:h-auto">
                                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                        <h4 className="font-medium text-slate-900">Members ({selectedMembers.length})</h4>
                                        <button type="button" onClick={() => setShowMemberSelector(true)} className="text-xs flex items-center text-indigo-600 font-medium hover:text-indigo-800">
                                            <UserPlus className="w-3 h-3 mr-1" /> Add
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {selectedMembers.map(memberId => {
                                            const user = allUsers.find(u => u.id === memberId);
                                            if (!user) return null;
                                            return (
                                                <div key={memberId} className="flex items-center bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                                                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{user.uniqueCode}</p>
                                                    </div>
                                                    <button type="button" onClick={() => toggleMemberSelection(memberId)} className="text-slate-400 hover:text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-4 border-t border-slate-200">
                                        <Button type="submit" className="w-full">Save Changes</Button>
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
                                <button type="button" onClick={() => setIsDummyModalOpen(true)} className="w-full flex items-center justify-center p-3 border-2 border-dashed border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                                    <Plus className="w-4 h-4 mr-2" /> Create & Add Dummy Member
                                </button>
                                {allUsers.map(user => (
                                    <div key={user.id} onClick={() => toggleMemberSelection(user.id)} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedMembers.includes(user.id) ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.uniqueCode}</p>
                                        </div>
                                        {selectedMembers.includes(user.id) && <Check className="w-5 h-5 text-indigo-600" />}
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
                        <Input label="Member Name" value={dummyName} onChange={(e) => setDummyName(e.target.value)} autoFocus />
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

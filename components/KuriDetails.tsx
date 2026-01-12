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

    // Monthly Management State
    const [selectedMonth, setSelectedMonth] = useState(1);

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
                // Members are now populated by backend including dummy users
                // So we just use the members array from kuriData directly
                setMembers(kuriData.members || []);
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

        const newDummy = {
            name: dummyName,
            email: `${dummyName.toLowerCase().replace(/\s/g, '')}@dummy.local`,
            password: Math.random().toString(36).substring(7), // Random password for dummy
            role: 'member',
            isDummy: true
        };

        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDummy)
            });

            if (response.ok) {
                const createdUser = await response.json();
                setAllUsers(prev => [createdUser, ...prev]);
                setSelectedMembers(prev => [...prev, createdUser.id]);
                setDummyName('');
                setIsDummyModalOpen(false);
            } else {
                console.error('Failed to create dummy user');
            }
        } catch (error) {
            console.error('Error creating dummy user:', error);
        }
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

    const handleUpdatePayment = async (memberId: string, status: 'paid' | 'pending') => {
        if (!kuri) return;

        const newPayment: Payment = {
            memberId,
            month: selectedMonth,
            status,
            paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        };

        // Filter out existing payment for this member/month and add new one
        const otherPayments = kuri.payments?.filter(p => !(p.memberId === memberId && p.month === selectedMonth)) || [];
        const updatedPayments = [...otherPayments, newPayment];

        const updatedKuri = { ...kuri, payments: updatedPayments };
        setKuri(updatedKuri); // Optimistic update

        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
            await fetch(`${API_BASE_URL}/kuris/${kuri.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payments: updatedPayments })
            });
        } catch (error) {
            console.error('Failed to update payment:', error);
            fetchData(); // Revert on error
        }
    };

    const handleSelectWinner = async (memberId: string) => {
        if (!kuri) return;

        // Filter out existing winner for this month
        const otherWinners = kuri.winners?.filter(w => w.month !== selectedMonth) || [];
        const updatedWinners = memberId ? [...otherWinners, { month: selectedMonth, memberId }] : otherWinners;

        const updatedKuri = { ...kuri, winners: updatedWinners };
        setKuri(updatedKuri); // Optimistic update

        try {
            const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
            await fetch(`${API_BASE_URL}/kuris/${kuri.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ winners: updatedWinners })
            });
        } catch (error) {
            console.error('Failed to update winner:', error);
            fetchData(); // Revert on error
        }
    };

    // Analytics Helpers
    const paidMembersCount = kuri?.payments?.filter(p => p.month === selectedMonth && p.status === 'paid').length || 0;
    const totalExpected = (kuri?.monthlyAmount || 0) * (kuri?.memberIds.length || 0);
    const totalCollected = (kuri?.monthlyAmount || 0) * paidMembersCount;
    const collectionProgress = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    const currentWinnerId = kuri?.winners?.find(w => w.month === selectedMonth)?.memberId;
    const currentWinner = members.find(m => m.id === currentWinnerId);

    // Winner Selection Validation
    const getKuriTakenDate = (start: string, month: number) => {
        const date = new Date(start);
        date.setMonth(date.getMonth() + (month - 1));
        return date;
    };

    const kuriTakenDate = kuri?.startDate ? getKuriTakenDate(kuri.startDate, selectedMonth) : new Date();
    const isWinnerSelectionEnabled = new Date() >= kuriTakenDate;
    const formattedTakenDate = kuriTakenDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

            {/* Monthly Management Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                        Monthly Activity
                    </h3>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        {Array.from({ length: kuri.duration || 12 }, (_, i) => i + 1).map(month => (
                            <button
                                key={month}
                                onClick={() => setSelectedMonth(month)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                                    ${selectedMonth === month
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                Month {month}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Winner Section */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide flex items-center">
                                <Bot className="w-4 h-4 mr-2" /> Winner of Month {selectedMonth}
                            </h4>
                            {!isWinnerSelectionEnabled && !currentWinner && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    <Clock className="w-3 h-3 mr-1" /> Opens on {formattedTakenDate}
                                </span>
                            )}
                        </div>

                        {currentWinner ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src={currentWinner.avatar} alt="" className="w-16 h-16 rounded-full border-4 border-white shadow-sm" />
                                    <div className="ml-4">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xl font-bold text-slate-900">{currentWinner.name}</div>
                                            {currentWinner.isDummy && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                                    <Bot className="w-3 h-3 mr-1" /> Placeholder
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-500">{currentWinner.uniqueCode}</div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleSelectWinner('')} // Clear winner
                                        className="text-sm text-amber-600 hover:text-amber-800 underline"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-slate-500 mb-4">No winner selected for this month yet.</p>
                                {isAdmin && (
                                    <div className="relative inline-block text-left w-full max-w-xs mx-auto">
                                        <select
                                            onChange={(e) => handleSelectWinner(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-slate-100 disabled:text-slate-400"
                                            value=""
                                            disabled={!isWinnerSelectionEnabled}
                                        >
                                            <option value="" disabled>
                                                {isWinnerSelectionEnabled ? "Select a Winner" : `Available on ${formattedTakenDate}`}
                                            </option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}{m.isDummy ? ' (Placeholder)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Status - Only Visible to Admin */}
                    {isAdmin && (
                        <div>
                            {currentWinner ? (
                                <>
                                    <div className="flex items-center justify-center mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <div className="text-center">
                                            <div className="text-sm text-slate-500 mb-1">Collection Progress</div>
                                            <div className="flex items-baseline justify-center gap-2">
                                                <span className="text-2xl font-bold text-indigo-600">₹{totalCollected.toLocaleString()}</span>
                                                <span className="text-sm text-slate-400">of ₹{totalExpected.toLocaleString()}</span>
                                            </div>
                                            <div className="w-48 h-2 bg-slate-200 rounded-full mt-3 mx-auto overflow-hidden">
                                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${collectionProgress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {members.map(member => {
                                            const payment = kuri.payments?.find(p => p.memberId === member.id && p.month === selectedMonth);
                                            const isPaid = payment?.status === 'paid';

                                            return (
                                                <div key={member.id} className={`flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors ${member.isDummy ? 'bg-slate-50/50 border-dashed border-slate-200' : 'bg-white border-slate-100'
                                                    }`}>
                                                    <div className="flex items-center">
                                                        <img src={member.avatar} alt="" className="w-10 h-10 rounded-full" />
                                                        <div className="ml-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-sm font-medium text-slate-900">{member.name}</div>
                                                                {member.isDummy && (
                                                                    <Bot className="w-3.5 h-3.5 text-amber-600" title="Placeholder User" />
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{member.uniqueCode}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                <CheckCircle className="w-3 h-3 mr-1" /> Paid
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                <Clock className="w-3 h-3 mr-1" /> Pending
                                                            </span>
                                                        )}

                                                        <button
                                                            onClick={() => handleUpdatePayment(member.id, isPaid ? 'pending' : 'paid')}
                                                            className={`p-1 rounded-full transition-colors ${isPaid ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                            title={isPaid ? "Mark as Pending" : "Mark as Paid"}
                                                        >
                                                            {isPaid ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <h4 className="text-slate-900 font-medium">Payment Management Locked</h4>
                                    <p className="text-sm text-slate-500 mt-1">Please select a winner for this month to unlock payment tracking.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Regular Member View - Only show their own status if needed */}
                    {!isAdmin && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-2">My Status</h4>
                            {(() => {
                                const myPayment = kuri.payments?.find(p => p.memberId === currentUser?.id && p.month === selectedMonth);
                                const isPaid = myPayment?.status === 'paid';
                                return (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Payment for Month {selectedMonth}</span>
                                        {isPaid ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <Clock className="w-3 h-3 mr-1" /> Pending
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

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

            {/* Members List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    Members ({members.length})
                </h3>
                {members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map(member => (
                            <div key={member.id} className={`flex items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors ${member.isDummy ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-slate-100'
                                }`}>
                                <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full" />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                        {member.isDummy && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                                <Bot className="w-3 h-3 mr-0.5" /> Placeholder
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">{member.isDummy ? member.uniqueCode : member.email}</p>
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
                        <p className="text-sm text-slate-500 mb-4">This will create a placeholder user account.</p>
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

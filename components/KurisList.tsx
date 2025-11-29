import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Plus, Edit2, Trash2, X, DollarSign, Calendar, Clock, Briefcase, UserPlus, Check, Bot, ShieldCheck } from 'lucide-react';
import { Kuri, User } from '../types';
import { KURIS_STORAGE_KEY, USERS_STORAGE_KEY } from '../constants';

interface KurisListProps {
  currentUser: User;
}

export const KurisList: React.FC<KurisListProps> = ({ currentUser }) => {
  const isAdmin = currentUser.role === 'admin';

  // Kuri State
  const [kuris, setKuris] = useState<Kuri[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Users State (for selection)
  const [users, setUsers] = useState<User[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKuri, setEditingKuri] = useState<Kuri | null>(null);

  // Member Selection State
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Dummy User Creation State inside Kuri Form
  const [isDummyModalOpen, setIsDummyModalOpen] = useState(false);
  const [dummyName, setDummyName] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Kuri>>({
    name: '',
    monthlyAmount: 0,
    status: 'pending',
    type: 'new',
    description: '',
    duration: '',
    startDate: '',
    kuriTakenDate: '',
    memberIds: [],
    adminId: ''
  });

  const fetchData = async () => {
    try {
      const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;

      // If admin, fetch all. If member, filter by ID.
      const kurisUrl = isAdmin
        ? `${API_BASE_URL}/kuris`
        : `${API_BASE_URL}/kuris?userId=${currentUser.id}`;

      const [kurisRes, usersRes] = await Promise.all([
        fetch(kurisUrl),
        fetch(`${API_BASE_URL}/users`)
      ]);

      if (kurisRes.ok) {
        setKuris(await kurisRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateUniqueCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '#';
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return code;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreate = () => {
    setEditingKuri(null);
    setFormData({
      name: '',
      monthlyAmount: 0,
      status: isAdmin ? 'active' : 'pending', // Admins auto-approve, members go to pending
      type: 'new',
      description: '',
      duration: '',
      startDate: new Date().toISOString().split('T')[0],
      kuriTakenDate: '',
      memberIds: [],
      adminId: isAdmin ? '' : currentUser.id // If member creates, they are default admin
    });
    // If not admin, add themselves as member by default?
    setSelectedMembers(isAdmin ? [] : [currentUser.id]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (kuri: Kuri) => {
    setEditingKuri(kuri);
    setFormData(kuri);
    setSelectedMembers(kuri.memberIds);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Kuri?')) {
      try {
        const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
        await fetch(`${API_BASE_URL}/kuris/${id}`, { method: 'DELETE' });
        setKuris(prev => prev.filter(k => k.id !== id));
      } catch (error) {
        console.error('Failed to delete kuri:', error);
      }
    }
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

    // In a real app, we should create this user via API first
    // For now, we'll just add to local state to simulate selection
    // Ideally: POST /api/v1/users with isDummy: true

    const newDummy: User = {
      id: Date.now().toString(),
      name: dummyName,
      email: `${dummyName.toLowerCase().replace(/\s/g, '')}@dummy.local`, // Placeholder
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // Enforce status logic if not admin
    let finalStatus = formData.status;
    if (!isAdmin) {
      finalStatus = 'pending';
    }

    const kuriData = {
      ...formData,
      monthlyAmount: Number(formData.monthlyAmount),
      status: finalStatus,
      memberIds: selectedMembers,
      adminId: formData.adminId || (isAdmin ? currentUser.id : currentUser.id), // Default to creator if empty
      createdBy: editingKuri?.createdBy || currentUser.id
    };

    try {
      const API_BASE_URL = `http://${window.location.hostname}:3001/api/v1`;
      if (editingKuri) {
        const response = await fetch(`${API_BASE_URL}/kuris/${editingKuri.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kuriData)
        });

        if (response.ok) {
          const updatedKuri = await response.json();
          setKuris(prev => prev.map(k => k.id === editingKuri.id ? updatedKuri : k));
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/kuris`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kuriData)
        });

        if (response.ok) {
          const newKuri = await response.json();
          setKuris(prev => [newKuri, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save kuri:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kuris</h1>
          <p className="mt-1 text-sm text-slate-500">Manage chit funds and savings schemes.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Kuri
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {kuris.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-slate-400 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No Kuris found</h3>
            <p className="mt-1 text-sm text-slate-500">Create a new Kuri scheme to get started.</p>
            <div className="mt-6">
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Kuri
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {kuris.map((kuri) => {
                  const adminUser = users.find(u => u.id === kuri.adminId);
                  // Permission Check: Can this user edit?
                  const canEdit = isAdmin || kuri.adminId === currentUser.id || kuri.createdBy === currentUser.id;

                  return (
                    <tr key={kuri.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{kuri.name}</div>
                        <div className="flex flex-col gap-0.5">
                          <div className="text-xs text-slate-500">{kuri.duration} duration</div>
                          {kuri.startDate && (
                            <div className="text-xs text-slate-400">Starts: {kuri.startDate}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {adminUser ? (
                          <div className="flex items-center">
                            <img src={adminUser.avatar} alt="" className="w-6 h-6 rounded-full mr-2" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700">{adminUser.name}</span>
                              <span className="text-xs text-slate-500">{adminUser.uniqueCode}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-700">${kuri.monthlyAmount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {kuri.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {kuri.memberIds.length} members
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${kuri.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            kuri.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'}
                        `}>
                          {kuri.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canEdit && (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleOpenEdit(kuri)} className="p-1 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(kuri.id)} className="p-1 text-red-600 hover:text-red-900 bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}


              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kuri Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">{editingKuri ? 'Edit Kuri' : 'Create New Kuri'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input label="Kuri Name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Gold Saving Scheme 2024" />
                    </div>
                    <Input label="Monthly Amount" name="monthlyAmount" type="number" icon={DollarSign} required value={formData.monthlyAmount} onChange={handleInputChange} />
                    <Input label="Status" name="status" as="select" value={formData.status} onChange={handleInputChange} disabled={!isAdmin}>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </Input>
                    <Input label="Type" name="type" as="select" value={formData.type} onChange={handleInputChange}>
                      <option value="new">New Scheme</option>
                      <option value="existing">Existing Scheme</option>
                    </Input>
                    <Input label="Duration" name="duration" icon={Clock} value={formData.duration} onChange={handleInputChange} placeholder="e.g. 12 Months" />
                    <Input label="Start Date" name="startDate" type="date" icon={Calendar} value={formData.startDate} onChange={handleInputChange} />

                    {/* Admin Selector - Only Visible to Admin */}
                    {isAdmin && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Kuri Admin (Manager)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ShieldCheck className="h-5 w-5 text-slate-400" />
                          </div>
                          <select
                            name="adminId"
                            value={formData.adminId}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 shadow-sm sm:text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select a Manager</option>
                            {users.filter(u => !u.isDummy).map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.uniqueCode})
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Assign a manager.</p>
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <Input label="Kuri Taken Date" name="kuriTakenDate" type="date" icon={Calendar} value={formData.kuriTakenDate} onChange={handleInputChange} />
                      <p className="mt-1 text-xs text-slate-500">Date when the pot was/will be taken (if applicable)</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Input label="Description" name="description" as="textarea" rows={3} value={formData.description} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                {/* Members Sidebar inside Modal */}
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
                    {selectedMembers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No members added yet.</p>
                    ) : (
                      selectedMembers.map(memberId => {
                        const user = users.find(u => u.id === memberId) || (memberId === currentUser.id ? currentUser : null);
                        if (!user) return null;
                        return (
                          <div key={memberId} className={`flex items-center bg-white p-2 rounded-lg shadow-sm border border-slate-200`}>
                            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-center">
                                <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
                                {formData.adminId === memberId && (
                                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800">
                                    Manager
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{user.uniqueCode}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleMemberSelection(memberId)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-4 border-t border-slate-200">
                    <Button type="submit" className="w-full">
                      {editingKuri ? 'Save Changes' : 'Create Kuri'}
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

                {/* Include Current User in List so they can add themselves if not there */}
                {!users.find(u => u.id === currentUser.id) && (
                  <div
                    onClick={() => toggleMemberSelection(currentUser.id)}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedMembers.includes(currentUser.id)
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="relative">
                      <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-slate-900">{currentUser.name} (Me)</p>
                      <p className="text-xs text-slate-500">{currentUser.uniqueCode}</p>
                    </div>
                    {selectedMembers.includes(currentUser.id) && <Check className="w-5 h-5 text-indigo-600" />}
                  </div>
                )}

                {users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => toggleMemberSelection(user.id)}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedMembers.includes(user.id)
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="relative">
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                      {user.isDummy && <div className="absolute -bottom-1 -right-1 bg-amber-100 rounded-full p-0.5"><Bot className="w-3 h-3 text-amber-600" /></div>}
                    </div>
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
            <p className="text-sm text-slate-500 mb-4">This will create a placeholder user account with a unique code.</p>
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
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { apiRequest } from '../lib/api';
import { Layout } from '../components/Layout';
import { Plus, X, UserCog, User, Key, Eye, EyeOff, ShieldAlert, Loader } from 'lucide-react';
import { User as UserType, UserRole } from '../types';

interface UsersListResponse {
  success: boolean;
  users: UserType[];
}

export const Users: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');

  // Change password states
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Fetch users
  const { data, isLoading, error } = useQuery<UsersListResponse>({
    queryKey: ['usersList'],
    queryFn: () => apiRequest<UsersListResponse>('admin.usersList', 'POST'),
    enabled: isAdmin,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: () => apiRequest('admin.createUser', 'POST', { name, email, password, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('viewer');
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create user.');
    }
  });

  // Update user active/role status mutation
  const updateUserMutation = useMutation({
    mutationFn: (params: { id: string; active?: boolean; role?: UserRole; password?: string }) => 
      apiRequest('admin.updateUser', 'POST', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setSelectedUser(null);
      setNewPassword('');
      setSuccessMsg('User updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update user.');
    }
  });

  if (!isAdmin) {
    return (
      <Layout currentRoute="users">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          <span>Access Denied. Admin privileges required.</span>
        </div>
      </Layout>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    createUserMutation.mutate();
  };

  return (
    <Layout currentRoute="users">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl text-slate-800">User Account Management</h2>
            <p className="text-slate-500 text-xs mt-1">Configure clinic staff roles and active portal accounts</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-hospital-600 hover:bg-hospital-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs transition-colors shadow self-start"
          >
            <Plus className="h-4 w-4" />
            Add Staff Account
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded text-xs text-emerald-800 font-semibold">
            {successMsg}
          </div>
        )}

        {/* Users registry table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b pb-3 border-slate-50">
            <UserCog className="h-5 w-5 text-hospital-600" />
            <h3 className="font-bold text-slate-800 text-sm">System Users Index</h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 text-hospital-600 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-xs">Failed to load system users.</p>
          ) : data?.users && data.users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Access Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-750">
                  {data.users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-550">{item.email}</td>
                      <td className="px-4 py-3">
                        <span className="bg-hospital-50 text-hospital-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                          {item.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateUserMutation.mutate({ id: item.id, active: !item.active })}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                            item.active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                          title="Click to toggle access status"
                        >
                          {item.active ? 'Active (Enabled)' : 'Blocked (Disabled)'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <select
                          value={item.role}
                          onChange={(e) => updateUserMutation.mutate({ id: item.id, role: e.target.value as UserRole })}
                          className="bg-slate-50 px-2 py-1 border border-slate-200 rounded text-[10px] outline-none text-slate-700 font-semibold"
                        >
                          <option value="admin">Admin</option>
                          <option value="doctor">Doctor</option>
                          <option value="nurse">Nurse</option>
                          <option value="staff">Staff</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <button
                          onClick={() => setSelectedUser(item)}
                          className="text-hospital-600 hover:text-hospital-800 font-bold hover:underline"
                        >
                          Reset Pass
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-4 text-center">No user accounts set up.</p>
          )}
        </div>

        {/* Add Account Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-hospital-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-hospital-300" />
                  <span className="font-bold text-sm">Add Staff Account</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-hospital-300 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Somsri Rakdee"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="somsri@bhh.local"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Clinic Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="doctor">Doctor (Modify / Share)</option>
                    <option value="nurse">Nurse (Modify / Share)</option>
                    <option value="staff">Staff (Modify / No Share)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-hospital-600 hover:bg-hospital-700 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors shadow"
                  >
                    {createUserMutation.isPending ? 'Saving...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="bg-hospital-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-hospital-300" />
                  <span className="font-bold text-sm">Reset Password: {selectedUser.name}</span>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-hospital-300 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateUserMutation.mutate({ id: selectedUser.id, password: newPassword })}
                    disabled={updateUserMutation.isPending || !newPassword}
                    className="bg-hospital-600 hover:bg-hospital-700 disabled:bg-slate-300 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors shadow"
                  >
                    Save Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

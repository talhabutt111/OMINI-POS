import React, { useState, useEffect } from 'react';
import { User } from '../types/pos';
import { api } from '../services/api';
import { Users, UserPlus, Shield, UserCheck, Trash2, Key, Check, AlertCircle, X } from 'lucide-react';

interface UsersViewProps {
  currentUser: User | null;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (err: any) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createUser({ name, email, role, password });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove user "${userName}"?`)) return;
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Staff & Cashier Management</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage store team members and configure role-based access permissions.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-xs active:scale-98"
        >
          <UserPlus className="h-4 w-4 text-emerald-400" />
          Add Staff Member
        </button>
      </div>

      {/* Role Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-bold mb-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <span>Admin Role Permissions</span>
          </div>
          <ul className="space-y-1.5 text-zinc-600">
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-indigo-600" />
              <span>Full POS Checkout & Register operations</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-indigo-600" />
              <span>Add, edit, delete catalog products & manage stock</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-indigo-600" />
              <span>Process transaction refunds & void orders</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-indigo-600" />
              <span>Generate AI daily/weekly/monthly reports & chat with AI agent</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-indigo-600" />
              <span>Manage staff accounts and system settings</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold mb-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Cashier Role Permissions</span>
          </div>
          <ul className="space-y-1.5 text-zinc-600">
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>High-speed checkout terminal & thermal receipts</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Real-time stock lookup & quick unit counts</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>View their own shift transaction logs</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Limited AI store reports (read-only)</span>
            </li>
            <li className="flex items-center gap-1.5 text-zinc-400">
              <X className="h-3.5 w-3.5 text-red-400" />
              <span>Cannot delete catalog items or tamper with staff accounts</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {users.map(u => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-zinc-50/70 transition">
                    <td className="px-5 py-3.5 font-bold text-zinc-900 flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs ${
                          u.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                      {isSelf && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500">
                          You
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-zinc-600">{u.email}</td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {u.role === 'admin' ? <Shield className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          title="Remove user"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Add Staff Account</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-zinc-900 focus:outline-none"
                  placeholder="e.g. Jordan Miller"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-zinc-900 focus:outline-none"
                  placeholder="jordan@omnipos.local"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Role Assignment</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-zinc-900 focus:outline-none"
                >
                  <option value="cashier">Cashier (Checkout, Shift log, Read-only)</option>
                  <option value="admin">Admin (Full store privileges & reports)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-zinc-900 focus:outline-none"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2 font-bold text-white hover:bg-zinc-800 transition"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

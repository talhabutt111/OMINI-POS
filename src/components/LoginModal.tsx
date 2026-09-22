import React, { useState } from 'react';
import { User } from '../types/pos';
import { api } from '../services/api';
import { ShieldCheck, UserCheck, LogIn, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('admin@omnipos.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'cashier') => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoSwitch(role);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-md mb-3">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Sign in to OmniPOS</h2>
          <p className="text-xs text-zinc-500 mt-1">
            JWT-authenticated multi-role access (Admin & Cashier)
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="user@omnipos.local"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 transition active:scale-98"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-zinc-400 font-medium">Or Quick Switch Demo Account</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickDemo('admin')}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 hover:bg-zinc-100 hover:border-zinc-300 transition text-center"
          >
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <span className="text-xs font-bold text-zinc-800">Admin Demo</span>
            <span className="text-[10px] text-zinc-500">Full system access</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('cashier')}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 hover:bg-zinc-100 hover:border-zinc-300 transition text-center"
          >
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-bold text-zinc-800">Cashier Demo</span>
            <span className="text-[10px] text-zinc-500">Checkout & shift view</span>
          </button>
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

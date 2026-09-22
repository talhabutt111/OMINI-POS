import React from 'react';
import { User } from '../types/pos';
import {
  ShoppingBag,
  Package,
  Receipt,
  Sparkles,
  Users,
  Shield,
  UserCheck,
  LogOut,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export type NavTab = 'pos' | 'inventory' | 'sales' | 'reports' | 'users';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User | null;
  lowStockCount: number;
  onOpenLogin: () => void;
  onLogout: () => void;
  onQuickSwitchRole: (role: 'admin' | 'cashier') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  lowStockCount,
  onOpenLogin,
  onLogout,
  onQuickSwitchRole,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('pos')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold text-base shadow-xs">
              <ShoppingBag className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-zinc-900">OmniPOS</span>
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium leading-none">AI Point of Sale</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('pos')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                currentTab === 'pos'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Register
            </button>

            <button
              onClick={() => onSelectTab('inventory')}
              className={`relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                currentTab === 'inventory'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Package className="h-4 w-4" />
              Inventory
              {lowStockCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('sales')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                currentTab === 'sales'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Receipt className="h-4 w-4" />
              Sales & Refunds
            </button>

            <button
              onClick={() => onSelectTab('reports')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                currentTab === 'reports'
                  ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 text-emerald-400 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-500" />
              AI Reports & Q&A
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectTab('users')}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  currentTab === 'users'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Users className="h-4 w-4" />
                Staff
              </button>
            )}
          </nav>
        </div>

        {/* User Account & Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* Role Indicator & Demo Switcher */}
              <button
                onClick={() => onQuickSwitchRole(isAdmin ? 'cashier' : 'admin')}
                title={`Currently ${currentUser.role}. Click to switch role.`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
              >
                <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
                <span>Switch to {isAdmin ? 'Cashier' : 'Admin'}</span>
              </button>

              <div className="flex items-center gap-2 rounded-xl bg-zinc-100 py-1 pl-2 pr-2.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-white ${
                    isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}
                >
                  {isAdmin ? <Shield className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight text-zinc-900">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log out"
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-zinc-100 px-2 py-1.5 gap-1 scrollbar-none">
        <button
          onClick={() => onSelectTab('pos')}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            currentTab === 'pos' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
          }`}
        >
          Register
        </button>
        <button
          onClick={() => onSelectTab('inventory')}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            currentTab === 'inventory' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
          }`}
        >
          Inventory {lowStockCount > 0 && `(${lowStockCount})`}
        </button>
        <button
          onClick={() => onSelectTab('sales')}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            currentTab === 'sales' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
          }`}
        >
          Sales & Refunds
        </button>
        <button
          onClick={() => onSelectTab('reports')}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            currentTab === 'reports' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
          }`}
        >
          AI Reports
        </button>
        {isAdmin && (
          <button
            onClick={() => onSelectTab('users')}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              currentTab === 'users' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
            }`}
          >
            Staff
          </button>
        )}
      </div>
    </header>
  );
};

import React from 'react';
import { User } from '../types/pos';
import { NavTab } from './Sidebar';
import {
  Menu,
  ShoppingBag,
  Package,
  Receipt,
  Sparkles,
  Users,
  Shield,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Coins,
  Plus,
  Tag,
} from 'lucide-react';

interface HeaderProps {
  currentTab: NavTab;
  currentUser: User | null;
  lowStockCount: number;
  currencySymbol: string;
  onOpenMobileMenu: () => void;
  onOpenLogin: () => void;
  onQuickSwitchRole: (role: 'admin' | 'cashier') => void;
  onNewSale: () => void;
  onOpenAddProduct: () => void;
  onOpenAddCategory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  lowStockCount,
  currencySymbol,
  onOpenMobileMenu,
  onOpenLogin,
  onQuickSwitchRole,
  onNewSale,
  onOpenAddProduct,
  onOpenAddCategory,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const tabLabels: Record<NavTab, { title: string; subtitle: string; icon: any }> = {
    pos: {
      title: 'POS Register Terminal',
      subtitle: 'Scan barcodes, search products, tender cash/card payments & print receipts',
      icon: ShoppingBag,
    },
    inventory: {
      title: 'Inventory & Stock Management',
      subtitle: 'Manage product catalog, real-time quantities, and low stock reorder thresholds',
      icon: Package,
    },
    categories: {
      title: 'Category Taxonomy & Classification',
      subtitle: 'Manage departments, retail groupings, visual color themes, and POS chips',
      icon: Tag,
    },
    sales: {
      title: 'Sales History & Orders Ledger',
      subtitle: 'Review completed transactions, audit payments, reprint invoices, and issue refunds',
      icon: Receipt,
    },
    reports: {
      title: 'AI Intelligence & Business Analytics',
      subtitle: 'Automated executive reports, revenue velocity audits, and interactive AI Q&A',
      icon: Sparkles,
    },
    users: {
      title: 'Staff Accounts & RBAC Permissions',
      subtitle: 'Manage administrative roles, cashier terminals, and access levels',
      icon: Users,
    },
  };

  const currentInfo = tabLabels[currentTab] || tabLabels.pos;
  const CurrentIcon = currentInfo.icon;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Context Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 transition"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
            <CurrentIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:inline">
                OmniPOS /
              </span>
              <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                {currentInfo.title}
              </h1>
            </div>
            <p className="hidden md:block text-[11px] text-zinc-500 leading-tight">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Currency Indicator, Quick Action & User Pill */}
      <div className="flex items-center gap-2.5">
        {/* Currency Pill */}
        <div
          title="Store Currency: Pakistani Rupee (PKR)"
          className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800"
        >
          <Coins className="h-3.5 w-3.5 text-emerald-600" />
          <span>PKR</span>
        </div>

        {/* Quick New Sale button (on non-pos tabs) */}
        {currentTab !== 'pos' && (
          <button
            onClick={onNewSale}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
            <span>Open Register</span>
          </button>
        )}

        {/* Quick Add Product button (on inventory tab for admin) */}
        {currentTab === 'inventory' && isAdmin && (
          <button
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>+ Add Product</span>
          </button>
        )}

        {/* Quick Add Category button (on categories tab for admin) */}
        {currentTab === 'categories' && isAdmin && onOpenAddCategory && (
          <button
            onClick={onOpenAddCategory}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>+ Add Category</span>
          </button>
        )}

        {/* User Pill & Quick Role Switch */}
        {currentUser ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickSwitchRole(isAdmin ? 'cashier' : 'admin')}
              title={`Active role: ${currentUser.role}. Click to quickly switch.`}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
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
                <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">
                  {currentUser.role}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

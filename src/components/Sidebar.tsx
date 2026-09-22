import React, { useState, useEffect } from 'react';
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
  PlusCircle,
  Printer,
  Clock,
  ChevronRight,
  X,
  Store,
  Coins,
  ArrowRightLeft,
  LogIn,
  Tag,
} from 'lucide-react';

export type NavTab = 'pos' | 'inventory' | 'categories' | 'sales' | 'reports' | 'users';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User | null;
  lowStockCount: number;
  categoriesCount?: number;
  totalSalesCount: number;
  todaySalesAmount: number;
  todayOrdersCount: number;
  currencySymbol: string;
  onOpenLogin: () => void;
  onLogout: () => void;
  onQuickSwitchRole: (role: 'admin' | 'cashier') => void;
  // Direct Sidebar Operations
  onNewSale: () => void;
  onOpenAddProduct: () => void;
  onOpenAddCategory?: () => void;
  onFilterLowStock: () => void;
  onQuickRunAIReport: () => void;
  onReprintLastReceipt: () => void;
  // Responsive drawer control
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  lowStockCount,
  categoriesCount = 0,
  totalSalesCount,
  todaySalesAmount,
  todayOrdersCount,
  currencySymbol,
  onOpenLogin,
  onLogout,
  onQuickSwitchRole,
  onNewSale,
  onOpenAddProduct,
  onOpenAddCategory,
  onFilterLowStock,
  onQuickRunAIReport,
  onReprintLastReceipt,
  isMobileOpen,
  onCloseMobile,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navItems = [
    {
      id: 'pos' as NavTab,
      label: 'POS Register',
      sublabel: 'Barcode scan & checkout',
      icon: ShoppingBag,
      badge: null,
      color: 'emerald',
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory & Stock',
      sublabel: 'Products, SKUs & alerts',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: 'amber',
      color: 'amber',
    },
    {
      id: 'categories' as NavTab,
      label: 'Categories',
      sublabel: 'Classification & taxonomy',
      icon: Tag,
      badge: categoriesCount > 0 ? `${categoriesCount}` : null,
      badgeColor: 'zinc',
      color: 'emerald',
    },
    {
      id: 'sales' as NavTab,
      label: 'Sales & Refunds',
      sublabel: 'Receipts & transactions',
      icon: Receipt,
      badge: totalSalesCount > 0 ? `${totalSalesCount}` : null,
      badgeColor: 'zinc',
      color: 'blue',
    },
    {
      id: 'reports' as NavTab,
      label: 'AI Intelligence',
      sublabel: 'Audit reports & AI Q&A',
      icon: Sparkles,
      badge: 'AI AGENT',
      badgeColor: 'emerald',
      color: 'emerald',
    },
    {
      id: 'users' as NavTab,
      label: 'Staff & Roles',
      sublabel: isAdmin ? 'Manage cashier & admin' : 'Admin access required',
      icon: Users,
      badge: isAdmin ? 'Admin' : 'Locked',
      badgeColor: isAdmin ? 'indigo' : 'zinc',
      color: 'indigo',
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-zinc-950 text-zinc-100 select-none">
      {/* Top Header & Terminal Status */}
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-zinc-950 font-black shadow-md shadow-emerald-500/10">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">OmniPOS</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                  PKR
                </span>
              </div>
              <p className="text-[11px] font-medium text-zinc-400">Terminal & Intelligence</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="md:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Terminal Clock & Online Badge */}
        <div className="mt-3.5 flex items-center justify-between rounded-lg bg-zinc-900/90 px-3 py-2 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-mono text-[11px]">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>{currentTime || '00:00:00'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
              PKR Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Navigation Menu
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isLocked = item.id === 'users' && !isAdmin;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isLocked) {
                      onOpenLogin();
                    } else {
                      handleNavClick(item.id);
                    }
                  }}
                  className={`w-full group flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/60'
                      : 'text-zinc-400 hover:bg-zinc-900/90 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 truncate">
                      <div className={`truncate ${isActive ? 'text-white font-bold' : 'text-zinc-300'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] font-normal text-zinc-400 truncate">
                        {item.sublabel}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-tight border ${
                        item.badgeColor === 'amber'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : item.badgeColor === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : item.badgeColor === 'indigo'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operational Quick Actions (User requested: "i want all opertions on side bar menu") */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase flex items-center justify-between">
            <span>Terminal Operations</span>
            <span className="text-[9px] text-zinc-400">Shortcuts</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {/* New Sale Button */}
            <button
              onClick={() => {
                onNewSale();
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-900 hover:text-white transition group"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                  New Order (F2)
                </div>
                <div className="text-[10px] text-zinc-400">Reset cart & register</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-400" />
            </button>

            {/* Add Product Shortcut */}
            <button
              onClick={() => {
                onOpenAddProduct();
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:border-indigo-500/40 hover:bg-zinc-900 hover:text-white transition group"
            >
              <PlusCircle className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300">
                  + Add Product
                </div>
                <div className="text-[10px] text-zinc-400">Catalog entry modal</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-400" />
            </button>

            {/* Add Category Shortcut */}
            <button
              onClick={() => {
                if (onOpenAddCategory) {
                  onOpenAddCategory();
                } else {
                  handleNavClick('categories');
                }
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-900 hover:text-white transition group"
            >
              <Tag className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                  + Add Category
                </div>
                <div className="text-[10px] text-zinc-400">Manage catalog taxonomy</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-400" />
            </button>

            {/* Check Low Stock Shortcut */}
            <button
              onClick={() => {
                onFilterLowStock();
                onCloseMobile();
              }}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs font-medium transition group ${
                lowStockCount > 0
                  ? 'border-amber-500/40 bg-amber-950/20 text-amber-200 hover:bg-amber-950/40'
                  : 'border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
              <div className="flex-1">
                <div className="text-xs font-semibold">
                  Low Stock Filter
                </div>
                <div className="text-[10px] text-zinc-400">
                  {lowStockCount > 0 ? `${lowStockCount} items need restock` : 'Stock levels nominal'}
                </div>
              </div>
              {lowStockCount > 0 && (
                <span className="rounded bg-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Run AI Report Shortcut */}
            <button
              onClick={() => {
                onQuickRunAIReport();
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-900 hover:text-white transition group"
            >
              <Sparkles className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                  Run AI Audit
                </div>
                <div className="text-[10px] text-zinc-400">Sales anomaly & summary</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-400" />
            </button>

            {/* Reprint Last Receipt */}
            <button
              onClick={() => {
                onReprintLastReceipt();
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white transition group"
            >
              <Printer className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-200">
                  Print Last Receipt
                </div>
                <div className="text-[10px] text-zinc-400">Thermal preview & PDF</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Shift Live Statistics Card (PKR figures formatted) */}
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-3.5 text-xs">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            <span>Today's Shift</span>
            <Coins className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-extrabold text-white font-mono tabular-nums tracking-tight">
            {currencySymbol}{todaySalesAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
            <span>{todayOrdersCount} completed sale(s)</span>
            <span className="font-semibold text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      {/* Bottom User Profile, Admin Role Switcher & Auth */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40">
        {currentUser ? (
          <div className="space-y-2.5">
            {/* User Info Bar */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-900/90 p-2 border border-zinc-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs ${
                    isAdmin ? 'bg-indigo-600 shadow-sm shadow-indigo-600/30' : 'bg-emerald-600 shadow-sm shadow-emerald-600/30'
                  }`}
                >
                  {isAdmin ? <Shield className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        isAdmin
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sign out of OmniPOS"
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Role Switcher Button (Admin ↔ Cashier) */}
            <button
              onClick={() => onQuickSwitchRole(isAdmin ? 'cashier' : 'admin')}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition active:scale-98"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-zinc-400" />
              <span>Switch to {isAdmin ? 'Cashier Role' : 'Admin Role'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onOpenLogin}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition active:scale-98"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In / Admin Access</span>
            </button>
            <p className="text-center text-[10px] text-zinc-400">
              Demo accounts available: admin & cashier
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Fixed 270px width) */}
      <aside className="hidden md:flex md:w-68 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-zinc-800 bg-zinc-950">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-72 max-w-xs flex-1 flex-col bg-zinc-950 z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

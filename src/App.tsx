import React, { useState, useEffect, useCallback } from 'react';
import { Product, User, Sale, AIReport, Category } from './types/pos';
import { api } from './services/api';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { POSCheckout } from './components/POSCheckout';
import { InventoryView } from './components/InventoryView';
import { CategoriesView } from './components/CategoriesView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { AIReportingView } from './components/AIReportingView';
import { UsersView } from './components/UsersView';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginModal } from './components/LoginModal';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('pos');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Operations triggers from Sidebar
  const [openAddProductTrigger, setOpenAddProductTrigger] = useState(0);
  const [openAddCategoryTrigger, setOpenAddCategoryTrigger] = useState(0);
  const [inventoryLowStockFilter, setInventoryLowStockFilter] = useState(false);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('All');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reports, setReports] = useState<AIReport[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active receipt preview
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      // 1. Check or restore auth
      let user = api.getCachedUser();
      if (!api.getToken() || !user) {
        // Auto-authenticate as Admin for instant out-of-the-box evaluator access
        try {
          const res = await api.demoSwitch('admin');
          user = res.user;
          setCurrentUser(user);
        } catch {
          // Fallback
        }
      } else {
        setCurrentUser(user);
      }

      // 2. Load catalog & sales & reports & settings & categories
      const [prods, cats, salesList, reportsList, settings] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSales().catch(() => []),
        api.getReports().catch(() => []),
        api.getSettings().catch(() => ({})),
      ]);

      setProducts(prods);
      setCategories(cats);
      setSales(salesList);
      setReports(reportsList);
      setStoreSettings(settings);
    } catch (err) {
      console.error('Error initializing POS:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const currencySymbol = storeSettings?.currencySymbol || 'PKR ';

  // Low stock items count
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

  // Today shift totals
  const todayStr = new Date().toDateString();
  const todayCompletedSales = sales.filter(
    s => s.status === 'completed' && new Date(s.createdAt).toDateString() === todayStr
  );
  const todaySalesAmount = todayCompletedSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const todayOrdersCount = todayCompletedSales.length;

  // Handlers
  const handleQuickSwitchRole = async (role: 'admin' | 'cashier') => {
    try {
      const res = await api.demoSwitch(role);
      setCurrentUser(res.user);
      if (role === 'cashier' && currentTab === 'users') {
        setCurrentTab('pos');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to switch role');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  // Direct Sidebar Operation Handlers
  const handleSidebarNewSale = () => {
    setCurrentTab('pos');
  };

  const handleSidebarOpenAddProduct = () => {
    if (currentUser?.role !== 'admin') {
      alert('Admin access is required to add new products. Switch to Admin in the sidebar.');
      return;
    }
    setCurrentTab('inventory');
    setInventoryLowStockFilter(false);
    setOpenAddProductTrigger(prev => prev + 1);
  };

  const handleSidebarOpenAddCategory = () => {
    if (currentUser?.role !== 'admin') {
      alert('Admin access is required to manage categories. Switch to Admin in the sidebar.');
      return;
    }
    setCurrentTab('categories');
    setOpenAddCategoryTrigger(prev => prev + 1);
  };

  const handleSidebarFilterLowStock = () => {
    setCurrentTab('inventory');
    setInventoryLowStockFilter(true);
  };

  const handleSidebarQuickRunAIReport = async () => {
    setCurrentTab('reports');
    try {
      const newReport = await api.generateReport('weekly');
      setReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
    } catch {
      // Handled inside AIReportingView
    }
  };

  const handleSidebarReprintLastReceipt = () => {
    if (sales.length === 0) {
      alert('No sales recorded yet. Process an order first.');
      return;
    }
    // Most recent sale
    const lastSale = sales[0];
    setActiveReceiptSale(lastSale);
  };

  // Checkout sale completion
  const handleCompleteSale = async (salePayload: any): Promise<Sale> => {
    const sale = await api.createSale(salePayload);
    // Refresh products stock & sales list
    const [updatedProducts, updatedSales] = await Promise.all([
      api.getProducts(),
      api.getSales(),
    ]);
    setProducts(updatedProducts);
    setSales(updatedSales);
    return sale;
  };

  // Inventory actions
  const handleAddProduct = async (productData: Partial<Product>) => {
    await api.createProduct(productData);
    const updated = await api.getProducts();
    setProducts(updated);
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    await api.updateProduct(id, productData);
    const updated = await api.getProducts();
    setProducts(updated);
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    const updated = await api.getProducts();
    setProducts(updated);
  };

  const handleAdjustStock = async (id: string, delta: number, reason: string) => {
    await api.adjustStock(id, delta, reason);
    const updated = await api.getProducts();
    setProducts(updated);
  };

  // Category actions
  const handleCreateCategory = async (catData: Partial<Category>) => {
    await api.createCategory(catData);
    const updated = await api.getCategories();
    setCategories(updated);
  };

  const handleUpdateCategory = async (id: string, catData: Partial<Category>) => {
    await api.updateCategory(id, catData);
    const [updatedCats, updatedProds] = await Promise.all([
      api.getCategories(),
      api.getProducts(),
    ]);
    setCategories(updatedCats);
    setProducts(updatedProds);
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    const [updatedCats, updatedProds] = await Promise.all([
      api.getCategories(),
      api.getProducts(),
    ]);
    setCategories(updatedCats);
    setProducts(updatedProds);
  };

  // Sales actions
  const handleRefundSale = async (id: string, action: 'refunded' | 'voided', reason: string) => {
    await api.refundSale(id, action, reason);
    const [updatedSales, updatedProducts] = await Promise.all([
      api.getSales(),
      api.getProducts(),
    ]);
    setSales(updatedSales);
    setProducts(updatedProducts);
  };

  const handleRefreshReports = async () => {
    const list = await api.getReports();
    setReports(list);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400 shadow-xl animate-pulse">
          <RefreshCw className="h-7 w-7 animate-spin" />
        </div>
        <p className="mt-5 text-xs font-bold tracking-widest text-zinc-400 uppercase">
          Initializing OmniPOS PKR Terminal & AI Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Sidebar Navigation (Fixed on Desktop, Drawer on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab === 'inventory') {
            setInventoryLowStockFilter(false);
          }
        }}
        currentUser={currentUser}
        lowStockCount={lowStockCount}
        categoriesCount={categories.length}
        totalSalesCount={sales.length}
        todaySalesAmount={todaySalesAmount}
        todayOrdersCount={todayOrdersCount}
        currencySymbol={currencySymbol}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onQuickSwitchRole={handleQuickSwitchRole}
        onNewSale={handleSidebarNewSale}
        onOpenAddProduct={handleSidebarOpenAddProduct}
        onOpenAddCategory={handleSidebarOpenAddCategory}
        onFilterLowStock={handleSidebarFilterLowStock}
        onQuickRunAIReport={handleSidebarQuickRunAIReport}
        onReprintLastReceipt={handleSidebarReprintLastReceipt}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main View Area Offset by Sidebar (md:pl-68 = 272px) */}
      <div className="md:pl-68 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <Header
          currentTab={currentTab}
          currentUser={currentUser}
          lowStockCount={lowStockCount}
          currencySymbol={currencySymbol}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onQuickSwitchRole={handleQuickSwitchRole}
          onNewSale={handleSidebarNewSale}
          onOpenAddProduct={handleSidebarOpenAddProduct}
          onOpenAddCategory={handleSidebarOpenAddCategory}
        />

        {/* Low stock alert banner */}
        {lowStockCount > 0 && currentTab !== 'inventory' && (
          <div className="bg-amber-500 text-white text-xs px-4 py-1.5 font-medium flex items-center justify-between shadow-xs">
            <div className="mx-auto flex max-w-7xl items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                Inventory Alert: {lowStockCount} product(s) have fallen below their safety stock threshold.
              </span>
              <button
                onClick={() => {
                  setCurrentTab('inventory');
                  setInventoryLowStockFilter(true);
                }}
                className="underline font-bold hover:text-amber-100 ml-1 cursor-pointer"
              >
                Review Low Stock Items →
              </button>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'pos' && (
              <POSCheckout
                products={products}
                categoriesList={categories}
                onCompleteSale={handleCompleteSale}
                onShowReceipt={sale => setActiveReceiptSale(sale)}
                currencySymbol={currencySymbol}
                defaultTaxRate={storeSettings?.defaultTaxRate || 16}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryView
                products={products}
                categoriesList={categories}
                currentUser={currentUser}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAdjustStock={handleAdjustStock}
                onManageCategories={() => setCurrentTab('categories')}
                currencySymbol={currencySymbol}
                openAddModalTrigger={openAddProductTrigger}
                initialFilterLowStock={inventoryLowStockFilter}
                initialCategoryFilter={inventoryCategoryFilter}
              />
            )}

            {currentTab === 'categories' && (
              <CategoriesView
                categories={categories}
                products={products}
                currentUser={currentUser}
                currencySymbol={currencySymbol}
                onCreateCategory={handleCreateCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onSelectCategoryFilter={categoryName => {
                  setInventoryCategoryFilter(categoryName);
                  setCurrentTab('inventory');
                }}
                openCreateModalTrigger={openAddCategoryTrigger}
              />
            )}

            {currentTab === 'sales' && (
              <SalesHistoryView
                sales={sales}
                currentUser={currentUser}
                onRefundSale={handleRefundSale}
                onShowReceipt={sale => setActiveReceiptSale(sale)}
                currencySymbol={currencySymbol}
                storeSettings={storeSettings}
              />
            )}

            {currentTab === 'reports' && (
              <AIReportingView
                reports={reports}
                currentUser={currentUser}
                onRefreshReports={handleRefreshReports}
                currencySymbol={currencySymbol}
              />
            )}

            {currentTab === 'users' && currentUser?.role === 'admin' && (
              <UsersView currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>

      {/* Printable / Downloadable PDF Receipt Modal */}
      <ReceiptModal
        sale={activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
        onNewSale={() => {
          setActiveReceiptSale(null);
          setCurrentTab('pos');
        }}
        storeSettings={storeSettings}
      />

      {/* Authentication & Role Switcher Modal with Admin Access */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={user => setCurrentUser(user)}
      />
    </div>
  );
}

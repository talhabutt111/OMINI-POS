import React, { useState, useMemo, useEffect } from 'react';
import { Product, User, Category } from '../types/pos';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Layers,
  DollarSign,
  TrendingUp,
  X,
  Tag,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  categoriesList?: Category[];
  currentUser: User | null;
  onAddProduct: (product: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAdjustStock: (id: string, delta: number, reason: string) => Promise<void>;
  onManageCategories?: () => void;
  currencySymbol?: string;
  openAddModalTrigger?: number;
  initialFilterLowStock?: boolean;
  initialCategoryFilter?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categoriesList = [],
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
  onManageCategories,
  currencySymbol = 'PKR ',
  openAddModalTrigger,
  initialFilterLowStock = false,
  initialCategoryFilter,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryFilter || 'All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(initialFilterLowStock);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Sync external category filter if passed
  useEffect(() => {
    if (initialCategoryFilter) {
      setSelectedCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Sync external low stock filter requests from sidebar
  useEffect(() => {
    if (initialFilterLowStock) {
      setFilterLowStockOnly(true);
    }
  }, [initialFilterLowStock]);

  // Sync external open add product modal from sidebar
  useEffect(() => {
    if (openAddModalTrigger && openAddModalTrigger > 0 && isAdmin) {
      handleOpenAdd();
    }
  }, [openAddModalTrigger]);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockTargetProduct, setStockTargetProduct] = useState<Product | null>(null);
  const [stockAdjustmentDelta, setStockAdjustmentDelta] = useState<number>(10);
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState<string>('Restock Shipment');

  // Form state for add/edit product
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: categoriesList[0]?.name || 'Beverages',
    costPrice: 500.0,
    sellingPrice: 1200.0,
    stock: 25,
    lowStockThreshold: 10,
    taxRate: 16,
    color: 'indigo',
  });

  const categories = useMemo(() => {
    const list = ['All'];
    if (categoriesList && categoriesList.length > 0) {
      categoriesList.forEach(c => {
        if (!list.includes(c.name)) list.push(c.name);
      });
    }
    products.forEach(p => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [products, categoriesList]);

  // Metrics
  const totalStockCount = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock <= p.lowStockThreshold).length, [products]);
  const totalCostValue = useMemo(() => products.reduce((acc, p) => acc + p.costPrice * p.stock, 0), [products]);
  const totalRetailValue = useMemo(() => products.reduce((acc, p) => acc + p.sellingPrice * p.stock, 0), [products]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchLowStock = filterLowStockOnly ? p.stock <= p.lowStockThreshold : true;
        return matchCategory && matchSearch && matchLowStock;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        else if (sortBy === 'stock') diff = a.stock - b.stock;
        else if (sortBy === 'price') diff = a.sellingPrice - b.sellingPrice;
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [products, selectedCategory, searchQuery, filterLowStockOnly, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890${Math.floor(1000000 + Math.random() * 9000000)}`,
      category: 'Beverages',
      costPrice: 450,
      sellingPrice: 950,
      stock: 25,
      lowStockThreshold: 10,
      taxRate: 16,
      color: 'indigo',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      taxRate: product.taxRate,
      color: product.color || 'indigo',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, formData);
      } else {
        await onAddProduct(formData);
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleOpenStockAdjust = (product: Product) => {
    setStockTargetProduct(product);
    setStockAdjustmentDelta(10);
    setStockAdjustmentReason('Restock Shipment');
    setIsStockModalOpen(true);
  };

  const handleConfirmStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockTargetProduct) return;
    try {
      await onAdjustStock(stockTargetProduct.id, stockAdjustmentDelta, stockAdjustmentReason);
      setIsStockModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total SKUs</span>
            <Package className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{products.length}</div>
          <div className="text-[11px] text-zinc-400 mt-1">{totalStockCount} units in inventory</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{lowStockCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">Requires immediate restocking</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Cost</span>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{currencySymbol}{totalCostValue.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Capital invested in stock</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Retail Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{currencySymbol}{totalRetailValue.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Potential margin: {currencySymbol}{(totalRetailValue - totalCostValue).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2 text-xs focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 focus:bg-white focus:border-zinc-900 focus:outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                filterLowStockOnly
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Low Stock ({lowStockCount})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onManageCategories && (
            <button
              onClick={onManageCategories}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition"
            >
              <Tag className="h-3.5 w-3.5 text-zinc-500" />
              <span>Categories</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 transition active:scale-98"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Product & SKU</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5 text-right">Cost Price</th>
                <th className="px-5 py-3.5 text-right">Selling Price</th>
                <th className="px-5 py-3.5 text-right">Gross Margin</th>
                <th className="px-5 py-3.5 text-center">Stock Level</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredProducts.map(product => {
                const isLowStock = product.stock <= product.lowStockThreshold;
                const isOutOfStock = product.stock <= 0;
                const marginPercent =
                  product.sellingPrice > 0
                    ? +(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)
                    : 0;

                return (
                  <tr key={product.id} className="hover:bg-zinc-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-zinc-900">{product.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <span>{product.sku}</span>
                        <span>•</span>
                        <span>BC: {product.barcode}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right text-zinc-500 font-medium">
                      {currencySymbol}{product.costPrice.toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      {currencySymbol}{product.sellingPrice.toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          marginPercent >= 50
                            ? 'bg-emerald-50 text-emerald-700'
                            : marginPercent >= 30
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {marginPercent}%
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`font-bold text-xs ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLowStock
                                ? 'text-amber-600'
                                : 'text-zinc-900'
                          }`}
                        >
                          {product.stock}
                        </span>
                        {isOutOfStock ? (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                            Out
                          </span>
                        ) : isLowStock ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                            Low (≤{product.lowStockThreshold})
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenStockAdjust(product)}
                          title="Adjust / Restock Quantity"
                          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 transition"
                        >
                          ± Stock
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(product)}
                              title="Edit details"
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                  onDeleteProduct(product.id);
                                }
                              }}
                              title="Delete product"
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal (Admin only) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none"
                  placeholder="e.g., Cold Brew Concentrate (32oz)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm font-mono focus:border-zinc-900 focus:outline-none"
                    placeholder="BEV-COL-01"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm font-mono focus:border-zinc-900 focus:outline-none"
                    placeholder="8901234..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-zinc-700">Category</label>
                    {onManageCategories && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductModalOpen(false);
                          onManageCategories();
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        + Manage
                      </button>
                    )}
                  </div>
                  {categoriesList && categoriesList.length > 0 ? (
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none bg-white"
                    >
                      {categoriesList.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none"
                      placeholder="Beverages, Bakery, Accessories..."
                    />
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Cost Price ({currencySymbol.trim()})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Selling Price ({currencySymbol.trim()})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Current Stock Qty</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    required
                    value={formData.lowStockThreshold}
                    onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 font-bold text-white hover:bg-zinc-800 transition"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {isStockModalOpen && stockTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900">Adjust Inventory Stock</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {stockTargetProduct.name} ({stockTargetProduct.sku})
            </p>

            <div className="my-4 rounded-xl bg-zinc-50 p-3 text-xs border border-zinc-200 flex justify-between items-center">
              <span className="text-zinc-600">Current Stock:</span>
              <span className="text-sm font-bold text-zinc-900">{stockTargetProduct.stock} units</span>
            </div>

            <form onSubmit={handleConfirmStockAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Quantity Adjustment (+ to add, - to deduct)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentDelta(prev => prev - 5)}
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 font-bold text-zinc-700 hover:bg-zinc-100"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentDelta(prev => prev - 1)}
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 font-bold text-zinc-700 hover:bg-zinc-100"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    required
                    value={stockAdjustmentDelta}
                    onChange={e => setStockAdjustmentDelta(Number(e.target.value))}
                    className="w-full text-center rounded-xl border border-zinc-300 py-1.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentDelta(prev => prev + 1)}
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 font-bold text-zinc-700 hover:bg-zinc-100"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentDelta(prev => prev + 10)}
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 font-bold text-zinc-700 hover:bg-zinc-100"
                  >
                    +10
                  </button>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  New stock will be:{' '}
                  <span className="font-bold text-zinc-900">
                    {Math.max(0, stockTargetProduct.stock + stockAdjustmentDelta)} units
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Reason for Adjustment</label>
                <select
                  value={stockAdjustmentReason}
                  onChange={e => setStockAdjustmentReason(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
                >
                  <option value="Restock Shipment">Restock PO Shipment</option>
                  <option value="Inventory Audit Count">Periodic Inventory Audit</option>
                  <option value="Damaged / Expired">Damaged / Expired Goods</option>
                  <option value="Customer Return">Customer Return</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2 font-bold text-white hover:bg-zinc-800 transition"
                >
                  Apply Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

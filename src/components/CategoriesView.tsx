import React, { useState, useMemo } from 'react';
import { Category, Product, User } from '../types/pos';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Coins,
  ArrowRight,
  Sparkles,
  Coffee,
  Utensils,
  Laptop,
  ShoppingBag,
  Leaf,
  Layers,
  Flame,
  Smartphone,
  Check,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  products: Product[];
  currentUser: User | null;
  currencySymbol?: string;
  onCreateCategory: (data: Partial<Category>) => Promise<void>;
  onUpdateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onSelectCategoryFilter: (categoryName: string) => void;
  openCreateModalTrigger?: number;
}

const AVAILABLE_COLORS = [
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-700', badge: 'bg-emerald-600' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700', badge: 'bg-amber-600' },
  { id: 'orange', name: 'Orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-700', badge: 'bg-orange-600' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700', badge: 'bg-blue-600' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-700', badge: 'bg-indigo-600' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700', badge: 'bg-purple-600' },
  { id: 'teal', name: 'Teal', bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-700', badge: 'bg-teal-600' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-700', badge: 'bg-rose-600' },
];

const AVAILABLE_ICONS = [
  { id: 'Tag', label: 'General Tag', icon: Tag },
  { id: 'Coffee', label: 'Coffee & Drinks', icon: Coffee },
  { id: 'Utensils', label: 'Food & Bakery', icon: Utensils },
  { id: 'Laptop', label: 'Tech & Gadgets', icon: Laptop },
  { id: 'ShoppingBag', label: 'Merchandise', icon: ShoppingBag },
  { id: 'Leaf', label: 'Organic & Pantry', icon: Leaf },
  { id: 'Sparkles', label: 'Desserts & Luxury', icon: Sparkles },
  { id: 'Layers', label: 'Bundles & Sets', icon: Layers },
  { id: 'Flame', label: 'Hot & Spices', icon: Flame },
  { id: 'Smartphone', label: 'Digital', icon: Smartphone },
  { id: 'Package', label: 'Bulk Goods', icon: Package },
];

const getIconComponent = (iconName?: string) => {
  const match = AVAILABLE_ICONS.find(i => i.id === iconName);
  return match ? match.icon : Tag;
};

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  products,
  currentUser,
  currencySymbol = 'PKR ',
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSelectCategoryFilter,
  openCreateModalTrigger,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'emerald',
    icon: 'Tag',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger add modal from external action (sidebar)
  React.useEffect(() => {
    if (openCreateModalTrigger && openCreateModalTrigger > 0 && isAdmin) {
      handleOpenCreate();
    }
  }, [openCreateModalTrigger]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: 'emerald',
      icon: 'Tag',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || 'emerald',
      icon: category.icon || 'Tag',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, formData);
      } else {
        await onCreateCategory(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmCategory) return;
    setIsSubmitting(true);
    try {
      await onDeleteCategory(deleteConfirmCategory.id);
      setDeleteConfirmCategory(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [categories, searchQuery]);

  // Aggregate Metrics
  const totalProducts = products.length;
  const totalCatalogInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.sellingPrice * p.stock, 0);
  }, [products]);

  const topCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return [...categories].sort((a, b) => (b.productCount || 0) - (a.productCount || 0))[0];
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Top Banner & High-Level Category Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Total Categories</span>
            <FolderOpen className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{categories.length}</span>
            <span className="text-xs text-zinc-500">managed groups</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Used for inventory categorization & POS billing</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Classified Products</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{totalProducts}</span>
            <span className="text-xs text-zinc-500">active items</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">100% catalog items linked to categories</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Largest Segment</span>
            <Tag className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-zinc-900 truncate">
              {topCategory ? topCategory.name : 'None'}
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {topCategory?.productCount || 0} items
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Highest product distribution density</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Total Catalog Valuation</span>
            <Coins className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-black text-zinc-900 font-mono">
            {currencySymbol}
            {totalCatalogInventoryValue.toLocaleString('en-PK', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Inventory selling price across categories</p>
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or description..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 transition active:scale-98"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>+ Add New Category</span>
            </button>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500">
              Read-Only Cashier View (Admin can modify categories)
            </div>
          )}
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-3">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900">No categories found</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            {searchQuery
              ? `No categories matching "${searchQuery}". Try a different keyword.`
              : 'Start by creating your first retail product category.'}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map(cat => {
            const Icon = getIconComponent(cat.icon);
            const colorDef =
              AVAILABLE_COLORS.find(c => c.id === cat.color) || AVAILABLE_COLORS[0];
            const count = cat.productCount || 0;
            const revenue = cat.totalRevenue || 0;

            return (
              <div
                key={cat.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-zinc-300 transition"
              >
                <div>
                  {/* Category Header with Icon & Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorDef.bg} ${colorDef.border}`}
                      >
                        <Icon className={`h-5 w-5 ${colorDef.text}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 group-hover:text-zinc-950">
                          {cat.name}
                        </h3>
                        <span
                          className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorDef.bg} ${colorDef.text}`}
                        >
                          {count} {count === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmCategory(cat)}
                          title="Delete Category"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-zinc-500 line-clamp-2 min-h-8">
                    {cat.description || 'No description provided.'}
                  </p>

                  {/* Performance Indicators */}
                  <div className="mt-4 rounded-xl bg-zinc-50/80 p-3 border border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Revenue
                      </div>
                      <div className="mt-0.5 font-bold text-zinc-900 font-mono">
                        {currencySymbol}
                        {revenue.toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Inventory Share
                      </div>
                      <div className="mt-0.5 font-bold text-zinc-900">
                        {totalProducts > 0
                          ? `${Math.round((count / totalProducts) * 100)}%`
                          : '0%'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer / Filter Inventory Action */}
                <div className="mt-5 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => onSelectCategoryFilter(cat.name)}
                    className="w-full flex items-center justify-between rounded-xl py-2 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition group/btn"
                  >
                    <span>View in Inventory Catalog</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-emerald-400">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Organize your POS products and catalog taxonomy
                  </p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Beverages, Bakery, Electronics"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of products in this category..."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none resize-none"
                />
              </div>

              {/* Color Accent Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Color Theme Badge
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_COLORS.map(c => {
                    const isSelected = formData.color === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setFormData({ ...formData, color: c.id })}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs transition ${
                          isSelected
                            ? 'border-zinc-900 ring-2 ring-zinc-900/10 bg-zinc-50 font-bold'
                            : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full ${c.badge} shrink-0`} />
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Category Icon
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                  {AVAILABLE_ICONS.map(i => {
                    const IconComponent = i.icon;
                    const isSelected = formData.icon === i.id;
                    return (
                      <button
                        type="button"
                        key={i.id}
                        onClick={() => setFormData({ ...formData, icon: i.id })}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center text-[10px] transition ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-xs'
                            : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="truncate w-full">{i.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Pill */}
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-3">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Live Preview in POS & Catalog:
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const PreviewIcon = getIconComponent(formData.icon);
                    const colorDef =
                      AVAILABLE_COLORS.find(c => c.id === formData.color) || AVAILABLE_COLORS[0];
                    return (
                      <div
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 ${colorDef.bg} ${colorDef.border}`}
                      >
                        <PreviewIcon className={`h-4 w-4 ${colorDef.text}`} />
                        <span className={`text-xs font-bold ${colorDef.text}`}>
                          {formData.name || 'Category Name'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 mb-3">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900">
              Delete "{deleteConfirmCategory.name}"?
            </h3>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to delete this category? Any associated products (
              <span className="font-bold text-zinc-900">
                {deleteConfirmCategory.productCount || 0} product(s)
              </span>
              ) will automatically be moved to your primary category to preserve sales history and stock
              integrity.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmCategory(null)}
                className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

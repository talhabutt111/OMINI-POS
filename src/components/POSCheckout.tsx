import React, { useState, useMemo, useRef } from 'react';
import { Product, CartItem, PaymentMethod, Sale, Category } from '../types/pos';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  Percent,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Check,
  Tag,
} from 'lucide-react';

interface POSCheckoutProps {
  products: Product[];
  categoriesList?: Category[];
  onCompleteSale: (saleData: any) => Promise<Sale>;
  onShowReceipt: (sale: Sale) => void;
  currencySymbol?: string;
  defaultTaxRate?: number;
}

// Simple Web Audio sound synthesizer for physical POS feedback
function playSound(type: 'beep' | 'success' | 'warn') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'warn') {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // AudioContext might be muted or unavailable
  }
}

export const POSCheckout: React.FC<POSCheckoutProps> = ({
  products,
  categoriesList = [],
  onCompleteSale,
  onShowReceipt,
  currencySymbol = 'PKR ',
  defaultTaxRate = 16,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Extract categories (managed categories + any remaining product categories)
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

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      playSound('warn');
      setErrorMessage(`"${product.name}" is out of stock!`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          playSound('warn');
          setErrorMessage(`Cannot exceed current available stock (${product.stock})`);
          setTimeout(() => setErrorMessage(null), 3000);
          return prev;
        }
        playSound('beep');
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      playSound('beep');
      return [...prev, { product, quantity: 1, discountPercent: 0 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock) {
              playSound('warn');
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setOrderDiscountPercent(0);
    setCashTendered('');
    setCheckoutNotes('');
  };

  // Barcode quick enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      p =>
        p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched);
      setBarcodeInput('');
    } else {
      playSound('warn');
      setErrorMessage(`No product found matching code: "${barcodeInput}"`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const unit = item.customPrice ?? item.product.sellingPrice;
      const lineDisc = item.discountPercent ? (unit * item.discountPercent) / 100 : 0;
      return acc + (unit - lineDisc) * item.quantity;
    }, 0);
  }, [cart]);

  const discountTotal = useMemo(() => {
    if (orderDiscountPercent <= 0) return 0;
    return (subtotal * orderDiscountPercent) / 100;
  }, [subtotal, orderDiscountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountTotal);

  const taxTotal = useMemo(() => {
    // calculate average weighted or default tax
    return (taxableAmount * defaultTaxRate) / 100;
  }, [taxableAmount, defaultTaxRate]);

  const grandTotal = +(taxableAmount + taxTotal).toFixed(2);

  const numTendered = parseFloat(cashTendered) || 0;
  const changeGiven = paymentMethod === 'cash' ? Math.max(0, +(numTendered - grandTotal).toFixed(2)) : 0;

  // Checkout submission
  const handleProcessCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && numTendered < grandTotal && numTendered > 0) {
      setErrorMessage(`Tendered amount (${currencySymbol}${numTendered}) is less than total (${currencySymbol}${grandTotal})`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const itemsPayload = cart.map(item => {
        const unit = item.customPrice ?? item.product.sellingPrice;
        const lineDisc = item.discountPercent || 0;
        const total = +((unit - (unit * lineDisc) / 100) * item.quantity).toFixed(2);

        return {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          unitPrice: unit,
          costPrice: item.product.costPrice,
          quantity: item.quantity,
          taxRate: item.product.taxRate,
          discountPercent: lineDisc,
          itemTotal: total,
        };
      });

      const sale = await onCompleteSale({
        items: itemsPayload,
        subtotal: +subtotal.toFixed(2),
        discountTotal: +discountTotal.toFixed(2),
        taxTotal: +taxTotal.toFixed(2),
        grandTotal: grandTotal,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? (numTendered || grandTotal) : grandTotal,
        changeGiven,
        notes: checkoutNotes,
      });

      playSound('success');
      handleClearCart();
      onShowReceipt(sale);
    } catch (err: any) {
      playSound('warn');
      setErrorMessage(err.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-5rem)]">
      {/* LEFT / CENTER: Catalog Browser */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
        {/* Search & Barcode Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product name, category, or SKU..."
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-zinc-400 shadow-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Scan/Type Barcode + Enter"
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-zinc-400 shadow-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </form>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const matchedCat = categoriesList.find(c => c.name.toLowerCase() === cat.toLowerCase());
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {cat !== 'All' && matchedCat?.color && (
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      matchedCat.color === 'amber'
                        ? 'bg-amber-500'
                        : matchedCat.color === 'orange'
                        ? 'bg-orange-500'
                        : matchedCat.color === 'indigo'
                        ? 'bg-indigo-500'
                        : matchedCat.color === 'teal'
                        ? 'bg-teal-500'
                        : matchedCat.color === 'purple'
                        ? 'bg-purple-500'
                        : matchedCat.color === 'blue'
                        ? 'bg-blue-500'
                        : matchedCat.color === 'rose'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 overflow-y-auto max-h-[calc(100vh-17rem)] pr-1">
          {filteredProducts.map(product => {
            const isLowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
            const isOutOfStock = product.stock <= 0;
            const inCartItem = cart.find(c => c.product.id === product.id);

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && handleAddToCart(product)}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-3.5 transition-all text-left select-none ${
                  isOutOfStock
                    ? 'border-zinc-200 opacity-60 cursor-not-allowed bg-zinc-50'
                    : 'border-zinc-200 hover:border-zinc-400 hover:shadow-md cursor-pointer active:scale-97'
                }`}
              >
                {inCartItem && (
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 font-bold text-xs text-white shadow-md">
                    {inCartItem.quantity}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {product.category}
                    </span>
                    {isOutOfStock ? (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                        Only {product.stock} left
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">
                        {product.stock} in stock
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-xs text-zinc-800 line-clamp-2 leading-snug group-hover:text-zinc-950">
                    {product.name}
                  </h3>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{product.sku}</div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100">
                  <div className="font-bold text-sm text-zinc-900">
                    {currencySymbol}{product.sellingPrice.toFixed(2)}
                  </div>
                  <div className="rounded-lg bg-zinc-100 p-1.5 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-zinc-400">
              <p className="text-sm font-medium">No products match your search</p>
              <p className="text-xs mt-1">Try searching for a different keyword or category</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart & Billing Terminal */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/70 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900">Current Order</span>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
              {cart.reduce((acc, i) => acc + i.quantity, 0)} items
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 max-h-[38vh]">
          {cart.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-zinc-400">
              <CreditCard className="h-8 w-8 stroke-1 text-zinc-300 mb-2" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[11px] text-zinc-400">Click products or scan barcode to add</p>
            </div>
          ) : (
            cart.map(item => {
              const unit = item.customPrice ?? item.product.sellingPrice;
              const lineTotal = +(unit * item.quantity).toFixed(2);

              return (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5 hover:border-zinc-200 transition"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="font-medium text-xs text-zinc-800 truncate">
                      {item.product.name}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                      <span>{currencySymbol}{unit.toFixed(2)} each</span>
                      <span className="text-zinc-300">•</span>
                      <span className="font-semibold text-zinc-700">{currencySymbol}{lineTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 active:scale-95 transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-zinc-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 active:scale-95 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="ml-1 p-1 text-zinc-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calculations & Order Adjustments */}
        <div className="border-t border-zinc-200 bg-zinc-50/50 p-4 space-y-2 text-xs">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span className="font-medium text-zinc-900">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>

          {/* Discount Field */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-zinc-600">
              <Percent className="h-3.5 w-3.5 text-zinc-400" />
              <span>Discount</span>
            </div>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map(pct => (
                <button
                  key={pct}
                  onClick={() => setOrderDiscountPercent(pct)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    orderDiscountPercent === pct
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              {discountTotal > 0 && (
                <span className="font-medium text-emerald-700 ml-1">
                  -{currencySymbol}{discountTotal.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between text-zinc-600">
            <span>Sales Tax ({defaultTaxRate}%)</span>
            <span className="font-medium text-zinc-900">{currencySymbol}{taxTotal.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-zinc-900">Grand Total</span>
            <span className="text-xl font-extrabold text-zinc-900">
              {currencySymbol}{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-zinc-200 p-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-semibold transition ${
                paymentMethod === 'card'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Card</span>
            </button>

            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-semibold transition ${
                paymentMethod === 'cash'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Banknote className="h-4 w-4" />
              <span>Cash</span>
            </button>

            <button
              onClick={() => setPaymentMethod('mobile_upi')}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-semibold transition ${
                paymentMethod === 'mobile_upi'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Mobile</span>
            </button>

            <button
              onClick={() => setPaymentMethod('split')}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-semibold transition ${
                paymentMethod === 'split'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Split</span>
            </button>
          </div>

          {/* Cash Tendered Presets & Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2 rounded-xl bg-zinc-50 p-3 border border-zinc-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Tendered Cash:</span>
                <input
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  placeholder={grandTotal.toFixed(2)}
                  className="w-28 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-right font-bold text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => setCashTendered(grandTotal.toFixed(2))}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Exact
                </button>
                {(currencySymbol.includes('PKR') ? [100, 500, 1000, 5000] : [10, 20, 50, 100]).map(val => (
                  <button
                    key={val}
                    onClick={() => setCashTendered(val.toString())}
                    className="flex-1 rounded-lg border border-zinc-200 bg-white py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                  >
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1 text-zinc-700 font-semibold">
                <span>Change Returned:</span>
                <span className="font-mono text-sm font-bold text-emerald-700">
                  {currencySymbol}{changeGiven.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Checkout Action Button */}
          <button
            onClick={handleProcessCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white shadow-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition"
          >
            {isProcessing ? (
              <span>Processing...</span>
            ) : (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Charge {currencySymbol}{grandTotal.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

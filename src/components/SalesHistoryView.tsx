import React, { useState, useMemo } from 'react';
import { Sale, User } from '../types/pos';
import { downloadReceiptPdf } from '../services/receiptPdf';
import {
  Search,
  Receipt,
  Download,
  Eye,
  RotateCcw,
  Ban,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

interface SalesHistoryViewProps {
  sales: Sale[];
  currentUser: User | null;
  onRefundSale: (saleId: string, action: 'refunded' | 'voided', reason: string) => Promise<void>;
  onShowReceipt: (sale: Sale) => void;
  currencySymbol?: string;
  storeSettings?: any;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  currentUser,
  onRefundSale,
  onShowReceipt,
  currencySymbol = 'PKR ',
  storeSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Refund / Void Modal
  const [targetSale, setTargetSale] = useState<Sale | null>(null);
  const [refundAction, setRefundAction] = useState<'refunded' | 'voided'>('refunded');
  const [refundReason, setRefundReason] = useState('Customer returned item in original condition');
  const [isRefunding, setIsRefunding] = useState(false);

  // Filter logic
  const filteredSales = useMemo(() => {
    const now = Date.now();
    return sales.filter(sale => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        sale.saleNumber.toLowerCase().includes(q) ||
        sale.cashierName.toLowerCase().includes(q) ||
        sale.items.some(i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));

      // Date
      let matchDate = true;
      const saleTime = new Date(sale.createdAt).getTime();
      if (dateFilter === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        matchDate = saleTime >= startOfToday.getTime();
      } else if (dateFilter === '7days') {
        matchDate = saleTime >= now - 7 * 86400000;
      } else if (dateFilter === '30days') {
        matchDate = saleTime >= now - 30 * 86400000;
      }

      // Status
      const matchStatus = statusFilter === 'all' || sale.status === statusFilter;

      // Payment
      const matchPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;

      return matchSearch && matchDate && matchStatus && matchPayment;
    });
  }, [sales, searchQuery, dateFilter, statusFilter, paymentFilter]);

  // Aggregate stats for current view
  const completedSales = filteredSales.filter(s => s.status === 'completed');
  const totalVolume = completedSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalProfit = completedSales.reduce((acc, s) => acc + s.profit, 0);
  const refundCount = filteredSales.filter(s => s.status === 'refunded' || s.status === 'voided').length;
  const refundRate = filteredSales.length > 0 ? +((refundCount / filteredSales.length) * 100).toFixed(1) : 0;

  const handleOpenRefund = (sale: Sale, action: 'refunded' | 'voided') => {
    setTargetSale(sale);
    setRefundAction(action);
    setRefundReason(action === 'refunded' ? 'Customer returned item in good condition' : 'Entry mistake or voided bill');
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSale) return;
    setIsRefunding(true);
    try {
      await onRefundSale(targetSale.id, refundAction, refundReason);
      setTargetSale(null);
    } catch (err: any) {
      alert(err.message || 'Refund action failed');
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Total Completed Sales
          </div>
          <div className="text-2xl font-bold text-zinc-900">{currencySymbol}{totalVolume.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-400 mt-1">{completedSales.length} transactions</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Realized Net Profit
          </div>
          <div className="text-2xl font-bold text-emerald-600">{currencySymbol}{totalProfit.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {totalVolume > 0 ? `${((totalProfit / totalVolume) * 100).toFixed(1)}% margin` : '0%'}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Avg Ticket Value
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            {currencySymbol}
            {completedSales.length > 0 ? (totalVolume / completedSales.length).toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Per transaction basket</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Refund / Void Rate
          </div>
          <div className={`text-2xl font-bold ${refundRate > 5 ? 'text-red-600' : 'text-zinc-900'}`}>
            {refundRate}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">{refundCount} refund events recorded</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by receipt #, cashier, or item..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2 text-xs focus:bg-white focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Date presets */}
          <div className="flex rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
            {(['all', 'today', '7days', '30days'] as const).map(period => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  dateFilter === period
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {period === 'all'
                  ? 'All Time'
                  : period === 'today'
                    ? 'Today'
                    : period === '7days'
                      ? '7 Days'
                      : '30 Days'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="voided">Voided</option>
          </select>

          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700 focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="mobile_upi">Mobile / UPI</option>
            <option value="split">Split</option>
          </select>
        </div>
      </div>

      {/* Sales Log Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Receipt #</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Cashier</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredSales.map(sale => {
                const isRefunded = sale.status === 'refunded' || sale.status === 'voided';
                return (
                  <tr key={sale.id} className="hover:bg-zinc-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-zinc-900">
                      {sale.saleNumber}
                    </td>

                    <td className="px-5 py-3.5 text-zinc-500">
                      <div>{new Date(sale.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {sale.cashierName}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="max-w-[200px] truncate text-zinc-700" title={sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}>
                        {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-zinc-400">{sale.items.length} unique line items</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700 uppercase">
                        {sale.paymentMethod === 'card' && <CreditCard className="h-3 w-3" />}
                        {sale.paymentMethod === 'cash' && <Banknote className="h-3 w-3" />}
                        {sale.paymentMethod === 'mobile_upi' && <Smartphone className="h-3 w-3" />}
                        {sale.paymentMethod === 'split' && <Layers className="h-3 w-3" />}
                        {sale.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      {currencySymbol}{sale.grandTotal.toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sale.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sale.status === 'refunded'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {sale.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        {isRefunded && <RotateCcw className="h-3 w-3" />}
                        {sale.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onShowReceipt(sale)}
                          title="View thermal receipt"
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => downloadReceiptPdf(sale, storeSettings)}
                          title="Download PDF Receipt"
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {!isRefunded && (
                          <button
                            onClick={() => handleOpenRefund(sale, 'refunded')}
                            title="Process Refund / Void (Restores Stock)"
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund / Void Confirmation Modal */}
      {targetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <RotateCcw className="h-5 w-5" />
                <span>Process Sale Refund / Void</span>
              </div>
              <button
                onClick={() => setTargetSale(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRefund} className="space-y-4 pt-4 text-xs">
              <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200 space-y-1 text-zinc-600">
                <div className="flex justify-between font-bold text-zinc-900">
                  <span>Receipt #:</span>
                  <span className="font-mono">{targetSale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sale Total:</span>
                  <span className="font-bold text-zinc-900">{currencySymbol}{targetSale.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{targetSale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="uppercase">{targetSale.paymentMethod}</span>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 p-2.5 text-amber-800 border border-amber-200">
                Notice: Confirming this will return all {targetSale.items.reduce((a, b) => a + b.quantity, 0)} item(s) back into product inventory stock.
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundAction('refunded')}
                    className={`rounded-xl py-2 font-bold transition ${
                      refundAction === 'refunded'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Customer Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundAction('voided')}
                    className={`rounded-xl py-2 font-bold transition ${
                      refundAction === 'voided'
                        ? 'bg-zinc-800 text-white shadow-xs'
                        : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Void Transaction
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Reason for {refundAction}</label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-zinc-900 focus:outline-none"
                  placeholder="Provide detailed explanation for the audit log..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTargetSale(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 transition"
                >
                  {isRefunding ? 'Processing...' : `Confirm ${refundAction.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

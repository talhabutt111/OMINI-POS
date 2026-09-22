import React from 'react';
import { Sale } from '../types/pos';
import { downloadReceiptPdf, printReceiptPdf } from '../services/receiptPdf';
import { Printer, Download, CheckCircle, X, ShoppingBag } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
  onNewSale?: () => void;
  storeSettings?: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  onClose,
  onNewSale,
  storeSettings,
}) => {
  if (!sale) return null;

  const symbol = storeSettings?.currencySymbol || 'PKR ';
  const storeName = storeSettings?.storeName || 'OmniPOS Store';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold text-sm">Payment Successful</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thermal Receipt Visual Preview */}
        <div className="overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-5 font-mono text-xs text-zinc-800 shadow-inner">
            <div className="text-center">
              <div className="font-sans font-bold text-base text-zinc-900">{storeName}</div>
              <div className="text-[11px] text-zinc-500">{storeSettings?.storeAddress || '742 Evergreen Terrace'}</div>
              <div className="text-[11px] text-zinc-500">{storeSettings?.storePhone || '+1 (555) 234-5678'}</div>
              <div className="my-2 border-b border-dashed border-zinc-300"></div>
            </div>

            <div className="space-y-1 text-[11px] text-zinc-600">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold text-zinc-900">{sale.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase font-semibold">{sale.paymentMethod.replace('_', ' ')}</span>
              </div>
              {sale.status !== 'completed' && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Status:</span>
                  <span className="uppercase">{sale.status}</span>
                </div>
              )}
            </div>

            <div className="my-2.5 border-b border-zinc-300"></div>

            {/* Items Header */}
            <div className="grid grid-cols-12 font-bold text-[11px] text-zinc-700 pb-1">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-3 text-right">PRICE</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>

            {/* Items Rows */}
            <div className="space-y-1.5 py-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px]">
                  <div className="col-span-6">
                    <span className="font-medium text-zinc-900">{item.quantity}x </span>
                    <span>{item.productName}</span>
                  </div>
                  <div className="col-span-3 text-right text-zinc-500">
                    {symbol}{item.unitPrice.toFixed(2)}
                  </div>
                  <div className="col-span-3 text-right font-medium text-zinc-900">
                    {symbol}{item.itemTotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="my-2.5 border-b border-zinc-300"></div>

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{symbol}{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-{symbol}{sale.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>Tax</span>
                <span>{symbol}{sale.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1 border-t border-zinc-300">
                <span>TOTAL</span>
                <span>{symbol}{sale.grandTotal.toFixed(2)}</span>
              </div>
              {sale.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-zinc-600 pt-1">
                    <span>Tendered</span>
                    <span>{symbol}{sale.amountTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Change</span>
                    <span>{symbol}{sale.changeGiven.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Barcode representation */}
            <div className="mt-4 pt-3 text-center border-t border-dashed border-zinc-300">
              <div className="inline-flex gap-0.5 h-6 items-center justify-center opacity-80">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 2, 1, 4, 2, 1, 3].map((w, i) => (
                  <div
                    key={i}
                    style={{ width: `${w * 1.5}px` }}
                    className={`h-full ${i % 2 === 0 ? 'bg-zinc-800' : 'bg-transparent'}`}
                  />
                ))}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1 tracking-widest">{sale.saleNumber}</div>
              <div className="text-[10px] text-zinc-400 mt-1 italic">Thank you for shopping!</div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => downloadReceiptPdf(sale, storeSettings)}
            className="flex-1 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 active:scale-98 transition"
          >
            <Download className="h-4 w-4 text-zinc-600" />
            Download PDF
          </button>
          <button
            onClick={() => printReceiptPdf(sale, storeSettings)}
            className="flex-1 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 active:scale-98 transition"
          >
            <Printer className="h-4 w-4 text-zinc-600" />
            Print Receipt
          </button>
          {onNewSale && (
            <button
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="flex-1 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-98 transition"
            >
              <ShoppingBag className="h-4 w-4" />
              New Sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

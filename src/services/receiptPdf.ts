import { jsPDF } from 'jspdf';
import { Sale } from '../types/pos';

export function generateReceiptPdf(sale: Sale, storeSettings?: {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  currencySymbol?: string;
}): jsPDF {
  const storeName = storeSettings?.storeName || 'OmniPOS Store';
  const storeAddress = storeSettings?.storeAddress || 'Mall Road, Commercial Zone 1, Lahore';
  const storePhone = storeSettings?.storePhone || '+92 (42) 3578-9000';
  const symbol = storeSettings?.currencySymbol || 'PKR ';

  // 80mm thermal receipt format (80mm width, dynamic height)
  const itemRowsCount = sale.items.length;
  const estimatedHeight = Math.max(160, 120 + itemRowsCount * 8 + 60);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, estimatedHeight],
  });

  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(storeName, 40, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text(storeAddress, 40, y, { align: 'center' });
  y += 4;
  doc.text(`Tel: ${storePhone}`, 40, y, { align: 'center' });
  y += 5;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(6, y, 74, y);
  y += 5;

  // Receipt Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(`Receipt #: ${sale.saleNumber}`, 6, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const formattedDate = new Date(sale.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Date: ${formattedDate}`, 6, y);
  y += 4;
  doc.text(`Cashier: ${sale.cashierName}`, 6, y);
  y += 4;
  doc.text(`Status: ${sale.status.toUpperCase()}`, 6, y);
  if (sale.refundReason) {
    y += 4;
    doc.setTextColor(190, 40, 40);
    doc.text(`Reason: ${sale.refundReason}`, 6, y);
    doc.setTextColor(80, 80, 80);
  }
  y += 5;

  // Items Table Header
  doc.setDrawColor(220, 220, 220);
  doc.line(6, y, 74, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text('ITEM / QTY', 6, y);
  doc.text('PRICE', 50, y, { align: 'right' });
  doc.text('TOTAL', 74, y, { align: 'right' });
  y += 3;
  doc.line(6, y, 74, y);
  y += 4;

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);

  for (const item of sale.items) {
    const itemName = item.productName.length > 22
      ? item.productName.substring(0, 20) + '..'
      : item.productName;

    doc.text(`${item.quantity}x ${itemName}`, 6, y);
    doc.text(`${symbol}${item.unitPrice.toFixed(2)}`, 50, y, { align: 'right' });
    doc.text(`${symbol}${item.itemTotal.toFixed(2)}`, 74, y, { align: 'right' });
    y += 4;

    if (item.discountPercent && item.discountPercent > 0) {
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 100);
      doc.text(`   Discount: ${item.discountPercent}% off`, 6, y);
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      y += 3.5;
    }
  }

  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(6, y, 74, y);
  y += 5;

  // Totals Section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  doc.text('Subtotal:', 40, y);
  doc.text(`${symbol}${sale.subtotal.toFixed(2)}`, 74, y, { align: 'right' });
  y += 4;

  if (sale.discountTotal > 0) {
    doc.text('Discount:', 40, y);
    doc.text(`-${symbol}${sale.discountTotal.toFixed(2)}`, 74, y, { align: 'right' });
    y += 4;
  }

  doc.text(`Sales Tax (${sale.items[0]?.taxRate || 8}%):`, 40, y);
  doc.text(`${symbol}${sale.taxTotal.toFixed(2)}`, 74, y, { align: 'right' });
  y += 5;

  // Grand Total Highlight
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 10, 10);
  doc.text('TOTAL:', 35, y);
  doc.text(`${symbol}${sale.grandTotal.toFixed(2)}`, 74, y, { align: 'right' });
  y += 6;

  doc.setDrawColor(220, 220, 220);
  doc.line(6, y, 74, y);
  y += 4.5;

  // Payment Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  const methodLabel = sale.paymentMethod === 'cash'
    ? 'Cash'
    : sale.paymentMethod === 'card'
      ? 'Credit/Debit Card'
      : sale.paymentMethod === 'mobile_upi'
        ? 'Mobile Pay (UPI/NFC)'
        : 'Split Payment';

  doc.text(`Payment: ${methodLabel}`, 6, y);
  y += 4;
  if (sale.paymentMethod === 'cash') {
    doc.text(`Amount Tendered: ${symbol}${sale.amountTendered.toFixed(2)}`, 6, y);
    y += 4;
    doc.text(`Change Returned: ${symbol}${sale.changeGiven.toFixed(2)}`, 6, y);
    y += 4;
  }

  // Footer & Barcode Representation
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  doc.text('Thank you for shopping with OmniPOS!', 40, y, { align: 'center' });
  y += 3.5;
  doc.text('Keep receipt for 30-day return policy.', 40, y, { align: 'center' });
  y += 5;

  // Barcode pattern simulation
  doc.setDrawColor(50, 50, 50);
  const barcodeY = y;
  const barcodePattern = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1, 4, 1, 2, 1];
  let curX = 18;
  for (let i = 0; i < barcodePattern.length; i++) {
    const width = barcodePattern[i] * 0.6;
    if (i % 2 === 0) {
      doc.rect(curX, barcodeY, width, 6, 'F');
    }
    curX += width + 0.4;
  }
  y += 9;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`* ${sale.saleNumber} *`, 40, y, { align: 'center' });

  return doc;
}

export function downloadReceiptPdf(sale: Sale, storeSettings?: any) {
  const doc = generateReceiptPdf(sale, storeSettings);
  doc.save(`${sale.saleNumber}.pdf`);
}

export function printReceiptPdf(sale: Sale, storeSettings?: any) {
  const doc = generateReceiptPdf(sale, storeSettings);
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl);
  if (printWindow) {
    printWindow.focus();
  }
}

export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  productCount?: number;
  totalRevenue?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  taxRate: number; // percentage, e.g. 8 for 8%
  color?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
  customPrice?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_upi' | 'split';

export type SaleStatus = 'completed' | 'refunded' | 'voided';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  taxRate: number;
  discountPercent: number;
  itemTotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  totalCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeGiven: number;
  status: SaleStatus;
  notes?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalProfit: number;
  profitMarginPercent: number;
  totalOrders: number;
  averageOrderValue: number;
  refundedOrdersCount: number;
  refundedAmount: number;
  paymentMethods: Record<string, number>;
  topProductsByRevenue: { name: string; sku: string; quantity: number; revenue: number }[];
  bottomProductsByRevenue: { name: string; sku: string; quantity: number; revenue: number }[];
  lowStockProducts: { name: string; sku: string; currentStock: number; threshold: number }[];
  hourlyOrDailyDistribution: { label: string; revenue: number; orders: number }[];
}

export interface AIReport {
  id: string;
  title: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  summaryMetrics: ReportSummary;
  executiveSummary: string;
  topStrengths: string[];
  anomaliesAndRisks: string[];
  actionableRecommendations: string[];
  rawAnalysisText?: string;
  createdAt: string;
  createdBy: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
}

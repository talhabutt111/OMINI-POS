import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Product, User, Sale, AIReport, ReportSummary, Category } from '../src/types/pos';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'omnipos_db.json');

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  categories: Category[];
  products: Product[];
  sales: Sale[];
  reports: AIReport[];
  settings: {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    currencySymbol: string;
    defaultTaxRate: number;
    receiptFooter: string;
  };
}

// Generate realistic past seed data
function generateSeedData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('admin123', 8);
  const cashierPasswordHash = bcrypt.hashSync('cashier123', 8);

  const users: (User & { passwordHash: string })[] = [
    {
      id: 'usr_admin',
      name: 'Sarah Connor (Admin)',
      email: 'admin@omnipos.local',
      role: 'admin',
      passwordHash: adminPasswordHash,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'usr_cashier_1',
      name: 'Alex Rivera (Cashier)',
      email: 'cashier@omnipos.local',
      role: 'cashier',
      passwordHash: cashierPasswordHash,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'usr_cashier_2',
      name: 'Maya Lin (Cashier)',
      email: 'maya@omnipos.local',
      role: 'cashier',
      passwordHash: cashierPasswordHash,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    }
  ];

  const categories: Category[] = [
    {
      id: 'cat_beverages',
      name: 'Beverages',
      description: 'Hot & cold drinks, artisan espresso, matcha, and bottled beverages',
      color: 'amber',
      icon: 'Coffee',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'cat_bakery',
      name: 'Bakery',
      description: 'Fresh baked croissants, sourdough loaves, muffins, and pastries',
      color: 'orange',
      icon: 'Utensils',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'cat_accessories',
      name: 'Accessories',
      description: 'Cables, wireless peripherals, mice, and checkout gadgets',
      color: 'indigo',
      icon: 'Laptop',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'cat_merchandise',
      name: 'Merchandise',
      description: 'Double-wall tumblers, pour-over drippers, and branded gear',
      color: 'teal',
      icon: 'ShoppingBag',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'cat_pantry',
      name: 'Pantry',
      description: 'Organic raw honey, preserves, spreads, and pantry items',
      color: 'emerald',
      icon: 'Leaf',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'cat_desserts',
      name: 'Desserts',
      description: 'Artisanal gelato tubs, sweet delicacies, and treats',
      color: 'purple',
      icon: 'Sparkles',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];

  const products: Product[] = [
    {
      id: 'prd_1',
      name: 'Artisan Espresso Roast (12oz)',
      sku: 'COF-ESP-01',
      barcode: '8901234001',
      category: 'Beverages',
      costPrice: 650.00,
      sellingPrice: 1450.00,
      stock: 38,
      lowStockThreshold: 10,
      taxRate: 16,
      color: 'amber',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'prd_2',
      name: 'Matcha Oat Latte Can',
      sku: 'BEV-MAT-02',
      barcode: '8901234002',
      category: 'Beverages',
      costPrice: 240.00,
      sellingPrice: 550.00,
      stock: 45,
      lowStockThreshold: 15,
      taxRate: 16,
      color: 'emerald',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'prd_3',
      name: 'Organic Almond Croissant',
      sku: 'BAK-CRO-03',
      barcode: '8901234003',
      category: 'Bakery',
      costPrice: 180.00,
      sellingPrice: 420.00,
      stock: 6, // Low stock!
      lowStockThreshold: 12,
      taxRate: 16,
      color: 'amber',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'prd_4',
      name: 'Sourdough Country Loaf',
      sku: 'BAK-SOU-04',
      barcode: '8901234004',
      category: 'Bakery',
      costPrice: 220.00,
      sellingPrice: 580.00,
      stock: 14,
      lowStockThreshold: 8,
      taxRate: 0,
      color: 'orange',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'prd_5',
      name: 'Wireless Ergonomic Mouse',
      sku: 'ACC-MOU-05',
      barcode: '8901234005',
      category: 'Accessories',
      costPrice: 1800.00,
      sellingPrice: 3850.00,
      stock: 4, // Low stock alert!
      lowStockThreshold: 6,
      taxRate: 16,
      color: 'indigo',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'prd_6',
      name: 'Braided USB-C Fast Cable (2m)',
      sku: 'ACC-CAB-06',
      barcode: '8901234006',
      category: 'Accessories',
      costPrice: 450.00,
      sellingPrice: 1200.00,
      stock: 52,
      lowStockThreshold: 10,
      taxRate: 16,
      color: 'blue',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'prd_7',
      name: 'Double-Wall Insulated Tumbler',
      sku: 'MER-TUM-07',
      barcode: '8901234007',
      category: 'Merchandise',
      costPrice: 950.00,
      sellingPrice: 2400.00,
      stock: 22,
      lowStockThreshold: 8,
      taxRate: 16,
      color: 'teal',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'prd_8',
      name: 'Organic Raw Honey Jar (500g)',
      sku: 'GRO-HON-08',
      barcode: '8901234008',
      category: 'Pantry',
      costPrice: 550.00,
      sellingPrice: 1350.00,
      stock: 3, // Low stock!
      lowStockThreshold: 8,
      taxRate: 0,
      color: 'yellow',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'prd_9',
      name: 'Sparkling Mineral Water (Glass)',
      sku: 'BEV-WAT-09',
      barcode: '8901234009',
      category: 'Beverages',
      costPrice: 120.00,
      sellingPrice: 280.00,
      stock: 60,
      lowStockThreshold: 20,
      taxRate: 16,
      color: 'cyan',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'prd_10',
      name: 'Vanilla Bean Gelato Tub',
      sku: 'DES-GEL-10',
      barcode: '8901234010',
      category: 'Desserts',
      costPrice: 350.00,
      sellingPrice: 850.00,
      stock: 19,
      lowStockThreshold: 10,
      taxRate: 16,
      color: 'pink',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'prd_11',
      name: 'Ceramic Pour-Over Dripper',
      sku: 'KIT-DRI-11',
      barcode: '8901234011',
      category: 'Merchandise',
      costPrice: 1100.00,
      sellingPrice: 2650.00,
      stock: 12,
      lowStockThreshold: 5,
      taxRate: 16,
      color: 'slate',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'prd_12',
      name: 'Gluten-Free Blueberry Muffin',
      sku: 'BAK-MUF-12',
      barcode: '8901234012',
      category: 'Bakery',
      costPrice: 150.00,
      sellingPrice: 380.00,
      stock: 18,
      lowStockThreshold: 8,
      taxRate: 16,
      color: 'purple',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];

  // Seed past 7 days of realistic sales
  const sales: Sale[] = [];
  const paymentMethods: ('cash' | 'card' | 'mobile_upi')[] = ['card', 'cash', 'card', 'mobile_upi', 'card'];
  let saleSeq = 1001;

  for (let d = 7; d >= 0; d--) {
    const dayDate = new Date(Date.now() - d * 86400000);
    // 3 to 7 sales per day
    const salesCount = d === 0 ? 5 : (3 + ((d * 7 + 3) % 5));
    for (let s = 0; s < salesCount; s++) {
      const saleDate = new Date(dayDate);
      saleDate.setHours(9 + (s * 2), 15 + (s * 7), 0);

      // pick 1-3 items
      const p1 = products[(s + d) % products.length];
      const p2 = products[(s * 2 + 1) % products.length];
      const q1 = 1 + ((s + d) % 3);
      const q2 = s % 2 === 0 ? 1 : 2;

      const item1Total = +(p1.sellingPrice * q1).toFixed(2);
      const item2Total = +(p2.sellingPrice * q2).toFixed(2);
      const subtotal = +(item1Total + item2Total).toFixed(2);
      const taxTotal = +((subtotal * 0.16)).toFixed(2);
      const grandTotal = +(subtotal + taxTotal).toFixed(2);
      const totalCost = +(p1.costPrice * q1 + p2.costPrice * q2).toFixed(2);
      const profit = +(grandTotal - taxTotal - totalCost).toFixed(2);

      const payMethod = paymentMethods[(s + d) % paymentMethods.length];
      const amountTendered = payMethod === 'cash' ? Math.ceil(grandTotal / 500) * 500 : grandTotal;
      const changeGiven = +(amountTendered - grandTotal).toFixed(2);

      const isRefunded = d === 3 && s === 1; // 1 realistic refund in the log

      sales.push({
        id: `sale_${saleSeq}`,
        saleNumber: `REC-${saleSeq}`,
        cashierId: s % 2 === 0 ? 'usr_cashier_1' : 'usr_cashier_2',
        cashierName: s % 2 === 0 ? 'Alex Rivera' : 'Maya Lin',
        items: [
          {
            productId: p1.id,
            productName: p1.name,
            sku: p1.sku,
            unitPrice: p1.sellingPrice,
            costPrice: p1.costPrice,
            quantity: q1,
            taxRate: p1.taxRate,
            discountPercent: 0,
            itemTotal: item1Total,
          },
          {
            productId: p2.id,
            productName: p2.name,
            sku: p2.sku,
            unitPrice: p2.sellingPrice,
            costPrice: p2.costPrice,
            quantity: q2,
            taxRate: p2.taxRate,
            discountPercent: 0,
            itemTotal: item2Total,
          }
        ],
        subtotal,
        discountTotal: 0,
        taxTotal,
        grandTotal,
        totalCost,
        profit,
        paymentMethod: payMethod,
        amountTendered,
        changeGiven,
        status: isRefunded ? 'refunded' : 'completed',
        refundReason: isRefunded ? 'Customer ordered incorrect beverage temperature' : undefined,
        createdAt: saleDate.toISOString(),
        updatedAt: saleDate.toISOString(),
      });

      saleSeq++;
    }
  }

  // Pre-cached AI Report for instant demonstration
  const reports: AIReport[] = [
    {
      id: 'rep_initial_weekly',
      title: 'Weekly POS Performance & Anomaly Audit',
      period: 'weekly',
      startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      endDate: new Date().toISOString(),
      summaryMetrics: {
        period: 'weekly',
        startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        endDate: new Date().toISOString(),
        totalRevenue: 84250.00,
        totalProfit: 41200.00,
        profitMarginPercent: 48.9,
        totalOrders: 32,
        averageOrderValue: 2632.80,
        refundedOrdersCount: 1,
        refundedAmount: 2245.00,
        paymentMethods: { card: 19, cash: 9, mobile_upi: 4 },
        topProductsByRevenue: [
          { name: 'Artisan Espresso Roast (12oz)', sku: 'COF-ESP-01', quantity: 24, revenue: 34800.00 },
          { name: 'Wireless Ergonomic Mouse', sku: 'ACC-MOU-05', quantity: 6, revenue: 23100.00 },
          { name: 'Double-Wall Insulated Tumbler', sku: 'MER-TUM-07', quantity: 8, revenue: 19200.00 },
        ],
        bottomProductsByRevenue: [
          { name: 'Gluten-Free Blueberry Muffin', sku: 'BAK-MUF-12', quantity: 4, revenue: 1520.00 },
          { name: 'Organic Raw Honey Jar (500g)', sku: 'GRO-HON-08', quantity: 3, revenue: 4050.00 },
        ],
        lowStockProducts: [
          { name: 'Organic Almond Croissant', sku: 'BAK-CRO-03', currentStock: 6, threshold: 12 },
          { name: 'Wireless Ergonomic Mouse', sku: 'ACC-MOU-05', currentStock: 4, threshold: 6 },
          { name: 'Organic Raw Honey Jar (500g)', sku: 'GRO-HON-08', currentStock: 3, threshold: 8 },
        ],
        hourlyOrDailyDistribution: [
          { label: 'Mon', revenue: 11250.00, orders: 4 },
          { label: 'Tue', revenue: 14520.00, orders: 6 },
          { label: 'Wed', revenue: 9840.00, orders: 4 },
          { label: 'Thu', revenue: 13580.00, orders: 5 },
          { label: 'Fri', revenue: 18890.00, orders: 7 },
          { label: 'Sat', revenue: 16180.00, orders: 6 },
        ]
      },
      executiveSummary: 'Weekly sales demonstrated steady performance with strong beverage and accessories volume. Revenue was led by Artisan Espresso Roast and Ergonomic Mice. Overall gross margin maintained healthy standing at 48.9%.',
      topStrengths: [
        'Artisan Espresso Roast generated significant turnover across Lahore customer traffic.',
        'Low refund rate (3.1%) indicating high customer satisfaction and order accuracy.',
        'High card adoption (59%) speeds up checkout throughput at the terminal.'
      ],
      anomaliesAndRisks: [
        'Critical low stock risk on Almond Croissants (6 units left) and Wireless Mice (4 units left).',
        'Bakery items show a dip in afternoon footfall compared to morning spikes.',
        'One refund recorded due to beverage specification error on shift #2.'
      ],
      actionableRecommendations: [
        'Place an immediate supplier PO for Wireless Mice and Organic Honey to prevent stockouts.',
        'Bundle Gluten-Free Muffins with Afternoon Espressos at a 10% combo discount to clear bakery stock.',
        'Review cashier order confirmation protocol for customized beverage orders.'
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: 'OmniPOS AI Agent',
    }
  ];

  return {
    users,
    categories,
    products,
    sales,
    reports,
    settings: {
      storeName: 'OmniPOS Pakistan Flagship',
      storeAddress: 'Main Boulevard, Gulberg III, Lahore, Pakistan',
      storePhone: '+92 (42) 3578-9000',
      currencySymbol: 'PKR ',
      defaultTaxRate: 16,
      receiptFooter: 'Shukriya for shopping with us! Retain receipt for 14-day exchange.',
    }
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.settings) {
          parsed.settings.currencySymbol = 'PKR ';
          if (!parsed.settings.storeName.includes('Pakistan') && !parsed.settings.storeName.includes('Lahore')) {
            parsed.settings.storeName = 'OmniPOS Pakistan Flagship';
            parsed.settings.storeAddress = 'Main Boulevard, Gulberg III, Lahore, Pakistan';
            parsed.settings.storePhone = '+92 (42) 3578-9000';
          }
        }
        if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
          parsed.categories = [
            { id: 'cat_beverages', name: 'Beverages', description: 'Hot & cold drinks, artisan espresso, matcha, and bottled beverages', color: 'amber', icon: 'Coffee', createdAt: new Date().toISOString() },
            { id: 'cat_bakery', name: 'Bakery', description: 'Fresh baked croissants, sourdough loaves, muffins, and pastries', color: 'orange', icon: 'Utensils', createdAt: new Date().toISOString() },
            { id: 'cat_accessories', name: 'Accessories', description: 'Cables, wireless peripherals, mice, and checkout gadgets', color: 'indigo', icon: 'Laptop', createdAt: new Date().toISOString() },
            { id: 'cat_merchandise', name: 'Merchandise', description: 'Double-wall tumblers, pour-over drippers, and branded gear', color: 'teal', icon: 'ShoppingBag', createdAt: new Date().toISOString() },
            { id: 'cat_pantry', name: 'Pantry', description: 'Organic raw honey, preserves, spreads, and pantry items', color: 'emerald', icon: 'Leaf', createdAt: new Date().toISOString() },
            { id: 'cat_desserts', name: 'Desserts', description: 'Artisanal gelato tubs, sweet delicacies, and treats', color: 'purple', icon: 'Sparkles', createdAt: new Date().toISOString() },
          ];
        }
        return parsed;
      } catch (err) {
        console.error('Failed to read db file, generating seed data:', err);
      }
    }
    const initial = generateSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save db file:', err);
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  }

  createUser(name: string, email: string, role: 'admin' | 'cashier', passwordPlain: string): User {
    const existing = this.getUserByEmail(email);
    if (existing) throw new Error('Email already registered');

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      email,
      role,
      passwordHash: bcrypt.hashSync(passwordPlain, 8),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveData();
    const { passwordHash, ...rest } = newUser;
    return rest;
  }

  deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Products
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  createProduct(item: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...item,
      id: `prd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.products.unshift(newProduct);
    this.saveData();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    this.data.products[index] = {
      ...this.data.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.products[index];
  }

  adjustStock(id: string, delta: number, reason?: string): Product {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    const newStock = Math.max(0, this.data.products[index].stock + delta);
    this.data.products[index].stock = newStock;
    this.data.products[index].updatedAt = new Date().toISOString();
    this.saveData();
    return this.data.products[index];
  }

  deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Categories
  getCategories(): Category[] {
    if (!this.data.categories) {
      this.data.categories = [];
    }

    return this.data.categories.map(cat => {
      const prods = this.data.products.filter(
        p => p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()
      );
      const productCount = prods.length;

      let totalRevenue = 0;
      for (const sale of this.data.sales) {
        if (sale.status === 'completed') {
          for (const item of sale.items) {
            const matchedProd = prods.find(p => p.id === item.productId);
            if (matchedProd) {
              totalRevenue += item.itemTotal;
            }
          }
        }
      }

      return {
        ...cat,
        productCount,
        totalRevenue: +totalRevenue.toFixed(2),
      };
    });
  }

  getCategoryById(id: string): Category | null {
    const cat = this.data.categories?.find(c => c.id === id);
    if (!cat) return null;
    const prods = this.data.products.filter(
      p => p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()
    );
    return {
      ...cat,
      productCount: prods.length,
    };
  }

  createCategory(data: Partial<Category>): Category {
    if (!this.data.categories) {
      this.data.categories = [];
    }
    const name = data.name?.trim() || '';
    if (!name) throw new Error('Category name is required');

    const existing = this.data.categories.find(
      c => c.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      throw new Error(`Category "${name}" already exists`);
    }

    const newCategory: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      description: data.description?.trim() || '',
      color: data.color || 'emerald',
      icon: data.icon || 'Tag',
      createdAt: new Date().toISOString(),
    };

    this.data.categories.push(newCategory);
    this.saveData();

    return {
      ...newCategory,
      productCount: 0,
      totalRevenue: 0,
    };
  }

  updateCategory(id: string, data: Partial<Category>): Category {
    if (!this.data.categories) this.data.categories = [];
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');

    const oldName = this.data.categories[index].name;
    const newName = data.name?.trim() || oldName;

    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      const duplicate = this.data.categories.find(
        c => c.id !== id && c.name.trim().toLowerCase() === newName.toLowerCase()
      );
      if (duplicate) throw new Error(`Category "${newName}" already exists`);

      // Cascade category name change to all products
      for (const prod of this.data.products) {
        if (prod.category.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          prod.category = newName;
          prod.updatedAt = new Date().toISOString();
        }
      }
    }

    this.data.categories[index] = {
      ...this.data.categories[index],
      name: newName,
      description: data.description !== undefined ? data.description.trim() : this.data.categories[index].description,
      color: data.color || this.data.categories[index].color,
      icon: data.icon || this.data.categories[index].icon,
    };

    this.saveData();

    const prods = this.data.products.filter(p => p.category.toLowerCase() === newName.toLowerCase());
    return {
      ...this.data.categories[index],
      productCount: prods.length,
    };
  }

  deleteCategory(id: string): boolean {
    if (!this.data.categories) return false;
    const cat = this.data.categories.find(c => c.id === id);
    if (!cat) return false;

    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => c.id !== id);

    if (this.data.categories.length !== initialLen) {
      const fallbackCat = this.data.categories[0]?.name || 'General';
      for (const prod of this.data.products) {
        if (prod.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) {
          prod.category = fallbackCat;
          prod.updatedAt = new Date().toISOString();
        }
      }
      this.saveData();
      return true;
    }
    return false;
  }

  // Sales
  getSales(filters?: {
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    status?: string;
    search?: string;
  }): Sale[] {
    let list = [...this.data.sales];

    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      list = list.filter(s => new Date(s.createdAt).getTime() >= start);
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime();
      list = list.filter(s => new Date(s.createdAt).getTime() <= end);
    }
    if (filters?.cashierId) {
      list = list.filter(s => s.cashierId === filters.cashierId);
    }
    if (filters?.status) {
      list = list.filter(s => s.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s =>
        s.saleNumber.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        s.items.some(i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSaleById(id: string): Sale | undefined {
    return this.data.sales.find(s => s.id === id);
  }

  createSale(payload: Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'updatedAt' | 'profit' | 'totalCost'>): Sale {
    const count = this.data.sales.length + 1001;
    const saleNumber = `REC-${count}`;
    const now = new Date().toISOString();

    // calculate total cost & deduct inventory
    let totalCost = 0;
    for (const item of payload.items) {
      const prd = this.getProductById(item.productId);
      const costPerUnit = prd ? prd.costPrice : (item.costPrice || 0);
      totalCost += costPerUnit * item.quantity;

      // Deduct inventory
      if (prd) {
        prd.stock = Math.max(0, prd.stock - item.quantity);
        prd.updatedAt = now;
      }
    }

    const profit = +(payload.grandTotal - payload.taxTotal - totalCost).toFixed(2);

    const newSale: Sale = {
      ...payload,
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      saleNumber,
      totalCost: +totalCost.toFixed(2),
      profit,
      createdAt: now,
      updatedAt: now,
    };

    this.data.sales.unshift(newSale);
    this.saveData();
    return newSale;
  }

  refundOrVoidSale(id: string, action: 'refunded' | 'voided', reason: string): Sale {
    const sale = this.getSaleById(id);
    if (!sale) throw new Error('Sale not found');
    if (sale.status !== 'completed') throw new Error(`Sale is already ${sale.status}`);

    sale.status = action;
    sale.refundReason = reason;
    sale.updatedAt = new Date().toISOString();

    // Restore inventory
    for (const item of sale.items) {
      const prd = this.getProductById(item.productId);
      if (prd) {
        prd.stock += item.quantity;
        prd.updatedAt = new Date().toISOString();
      }
    }

    this.saveData();
    return sale;
  }

  // Reports
  getReports(): AIReport[] {
    return [...this.data.reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReportById(id: string): AIReport | undefined {
    return this.data.reports.find(r => r.id === id);
  }

  saveReport(report: AIReport): AIReport {
    this.data.reports.unshift(report);
    this.saveData();
    return report;
  }

  deleteReport(id: string): boolean {
    const initialLen = this.data.reports.length;
    this.data.reports = this.data.reports.filter(r => r.id !== id);
    if (this.data.reports.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Aggregation helper for date range
  aggregateSalesSummary(startDate: string, endDate: string, period: 'daily' | 'weekly' | 'monthly' | 'custom' = 'weekly'): ReportSummary {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    const rangeSales = this.data.sales.filter(s => {
      const t = new Date(s.createdAt).getTime();
      return t >= startMs && t <= endMs;
    });

    const completed = rangeSales.filter(s => s.status === 'completed');
    const refunded = rangeSales.filter(s => s.status === 'refunded' || s.status === 'voided');

    const totalRevenue = +completed.reduce((acc, s) => acc + s.grandTotal, 0).toFixed(2);
    const totalProfit = +completed.reduce((acc, s) => acc + s.profit, 0).toFixed(2);
    const totalOrders = completed.length;
    const averageOrderValue = totalOrders > 0 ? +(totalRevenue / totalOrders).toFixed(2) : 0;
    const profitMarginPercent = totalRevenue > 0 ? +((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    const refundedAmount = +refunded.reduce((acc, s) => acc + s.grandTotal, 0).toFixed(2);

    const paymentMethods: Record<string, number> = {};
    const productStats: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};

    for (const s of completed) {
      paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + 1;
      for (const item of s.items) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.productName,
            sku: item.sku,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue = +(productStats[item.productId].revenue + item.itemTotal).toFixed(2);
      }
    }

    const sortedProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
    const topProductsByRevenue = sortedProducts.slice(0, 5);
    const bottomProductsByRevenue = sortedProducts.length > 5 ? sortedProducts.slice(-5).reverse() : [];

    const lowStockProducts = this.data.products
      .filter(p => p.stock <= p.lowStockThreshold)
      .map(p => ({
        name: p.name,
        sku: p.sku,
        currentStock: p.stock,
        threshold: p.lowStockThreshold,
      }));

    // Grouping by day or hour
    const distributionMap: Record<string, { revenue: number; orders: number }> = {};
    for (const s of completed) {
      const d = new Date(s.createdAt);
      const label = period === 'daily'
        ? `${d.getHours()}:00`
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!distributionMap[label]) {
        distributionMap[label] = { revenue: 0, orders: 0 };
      }
      distributionMap[label].revenue = +(distributionMap[label].revenue + s.grandTotal).toFixed(2);
      distributionMap[label].orders += 1;
    }

    const hourlyOrDailyDistribution = Object.entries(distributionMap).map(([label, val]) => ({
      label,
      revenue: val.revenue,
      orders: val.orders,
    }));

    return {
      period,
      startDate,
      endDate,
      totalRevenue,
      totalProfit,
      profitMarginPercent,
      totalOrders,
      averageOrderValue,
      refundedOrdersCount: refunded.length,
      refundedAmount,
      paymentMethods,
      topProductsByRevenue,
      bottomProductsByRevenue,
      lowStockProducts,
      hourlyOrDailyDistribution,
    };
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(settings: Partial<DatabaseSchema['settings']>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData();
    return this.data.settings;
  }
}

export const dbStore = new Store();

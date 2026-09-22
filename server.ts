import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbStore } from './server/store';
import { generateAIReport, askAIAgent } from './server/aiAgent';
import { User } from './src/types/pos';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'omnipos-super-secret-key-2026';

app.use(express.json());

// Auth middleware
interface AuthRequest extends Request {
  user?: User;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token provided in header, allow checking query or fallback to default cashier for ease of POS demo if desired
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || !decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const user = dbStore.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }
  next();
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const userWithHash = dbStore.getUserByEmail(email);
  if (!userWithHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, userWithHash.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { passwordHash, ...user } = userWithHash;
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return res.json({ token, user });
});

// Quick switch between demo admin and demo cashier
app.post('/api/auth/demo-switch', (req, res) => {
  const { role } = req.body;
  const email = role === 'admin' ? 'admin@omnipos.local' : 'cashier@omnipos.local';
  const userWithHash = dbStore.getUserByEmail(email);
  if (!userWithHash) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const { passwordHash, ...user } = userWithHash;
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
  return res.json({ token, user });
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

// User management (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  return res.json({ users: dbStore.getUsers() });
});

app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const newUser = dbStore.createUser(name, email, role, password);
    return res.status(201).json({ user: newUser });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create user' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  if (req.user?.id === id) {
    return res.status(400).json({ error: 'Cannot delete your own active account' });
  }
  const deleted = dbStore.deleteUser(id);
  if (!deleted) return res.status(404).json({ error: 'User not found' });
  return res.json({ success: true, message: 'User deleted' });
});

// ==================== CATEGORIES ====================
app.get('/api/categories', (req, res) => {
  const categories = dbStore.getCategories();
  return res.json({ categories });
});

app.post('/api/categories', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const category = dbStore.createCategory({ name, description, color, icon });
    return res.status(201).json({ category });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/categories/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const category = dbStore.updateCategory(id, req.body);
    return res.json({ category });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = dbStore.deleteCategory(id);
  if (!deleted) return res.status(404).json({ error: 'Category not found' });
  return res.json({ success: true, message: 'Category deleted' });
});

// ==================== PRODUCTS / INVENTORY ====================
app.get('/api/products', (req, res) => {
  const products = dbStore.getProducts();
  return res.json({ products });
});

app.post('/api/products', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, sku, barcode, category, costPrice, sellingPrice, stock, lowStockThreshold, taxRate, color } = req.body;
    if (!name || !sku || sellingPrice === undefined) {
      return res.status(400).json({ error: 'Name, SKU, and Selling Price are required' });
    }
    const product = dbStore.createProduct({
      name,
      sku,
      barcode: barcode || sku,
      category: category || 'General',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      taxRate: taxRate !== undefined ? Number(taxRate) : 8,
      color: color || 'indigo',
    });
    return res.status(201).json({ product });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updated = dbStore.updateProduct(id, req.body);
    return res.json({ product: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/products/:id/adjust-stock', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { delta, reason } = req.body;
    if (delta === undefined || typeof delta !== 'number') {
      return res.status(400).json({ error: 'Delta number is required' });
    }
    const updated = dbStore.adjustStock(id, delta, reason);
    return res.json({ product: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = dbStore.deleteProduct(id);
  if (!deleted) return res.status(404).json({ error: 'Product not found' });
  return res.json({ success: true });
});

// ==================== CHECKOUT & SALES ====================
app.get('/api/sales', authenticateToken, (req: AuthRequest, res) => {
  const { startDate, endDate, cashierId, status, search } = req.query;
  const sales = dbStore.getSales({
    startDate: startDate as string,
    endDate: endDate as string,
    cashierId: cashierId as string,
    status: status as string,
    search: search as string,
  });
  return res.json({ sales });
});

app.get('/api/sales/:id', authenticateToken, (req, res) => {
  const sale = dbStore.getSaleById(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  return res.json({ sale });
});

app.post('/api/sales', authenticateToken, (req: AuthRequest, res) => {
  try {
    const {
      items,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentMethod,
      amountTendered,
      changeGiven,
      notes,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cannot checkout with empty items' });
    }

    const cashierId = req.user?.id || 'usr_cashier_1';
    const cashierName = req.user?.name || 'Cashier';

    const sale = dbStore.createSale({
      cashierId,
      cashierName,
      items,
      subtotal: Number(subtotal),
      discountTotal: Number(discountTotal || 0),
      taxTotal: Number(taxTotal),
      grandTotal: Number(grandTotal),
      paymentMethod: paymentMethod || 'cash',
      amountTendered: Number(amountTendered || grandTotal),
      changeGiven: Number(changeGiven || 0),
      status: 'completed',
      notes,
    });

    return res.status(201).json({ sale });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/sales/:id/refund', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { action, reason } = req.body;
    if (!action || !['refunded', 'voided'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "refunded" or "voided"' });
    }
    const sale = dbStore.refundOrVoidSale(req.params.id, action, reason || 'Customer request');
    return res.json({ sale, message: `Sale successfully marked as ${action}` });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==================== AI REPORTING AGENT ====================
app.get('/api/reports', authenticateToken, (req, res) => {
  const reports = dbStore.getReports();
  return res.json({ reports });
});

app.get('/api/reports/:id', authenticateToken, (req, res) => {
  const report = dbStore.getReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  return res.json({ report });
});

app.post('/api/reports/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { period, startDate, endDate } = req.body;
    const resolvedPeriod = period || 'weekly';

    let resolvedStart = startDate;
    let resolvedEnd = endDate || new Date().toISOString();

    if (!resolvedStart) {
      const now = new Date();
      if (resolvedPeriod === 'daily') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        resolvedStart = startOfDay.toISOString();
      } else if (resolvedPeriod === 'monthly') {
        resolvedStart = new Date(now.getTime() - 30 * 86400000).toISOString();
      } else {
        // weekly default
        resolvedStart = new Date(now.getTime() - 7 * 86400000).toISOString();
      }
    }

    const report = await generateAIReport(
      resolvedPeriod,
      resolvedStart,
      resolvedEnd,
      req.user?.name || 'Store Manager'
    );

    return res.json({ report });
  } catch (err: any) {
    console.error('Error in /api/reports/generate:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate report' });
  }
});

app.delete('/api/reports/:id', authenticateToken, requireAdmin, (req, res) => {
  const deleted = dbStore.deleteReport(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Report not found' });
  return res.json({ success: true });
});

// Natural Language AI Q&A Panel
app.post('/api/ai/ask', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const result = await askAIAgent(question);
    return res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/ask:', err);
    return res.status(500).json({ error: err.message || 'Failed to answer query' });
  }
});

// Raw summary metrics endpoint
app.get('/api/analytics/summary', authenticateToken, (req, res) => {
  const { period, startDate, endDate } = req.query;
  const now = new Date();
  const start = (startDate as string) || new Date(now.getTime() - 7 * 86400000).toISOString();
  const end = (endDate as string) || now.toISOString();
  const summary = dbStore.aggregateSalesSummary(start, end, (period as any) || 'weekly');
  return res.json({ summary });
});

// Store Settings
app.get('/api/settings', (req, res) => {
  return res.json({ settings: dbStore.getSettings() });
});

app.put('/api/settings', authenticateToken, requireAdmin, (req, res) => {
  const updated = dbStore.updateSettings(req.body);
  return res.json({ settings: updated });
});

// ==================== VITE / STATIC SERVE ====================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite middleware for dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniPOS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

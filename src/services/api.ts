import { Product, User, Sale, AIReport, ReportSummary, PaymentMethod, Category } from '../types/pos';

const TOKEN_KEY = 'omnipos_jwt_token';
const USER_KEY = 'omnipos_user_cache';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem(TOKEN_KEY);
  }

  getCachedUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setCachedUser(user: User | null) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    this.setCachedUser(data.user);
    return data;
  }

  async demoSwitch(role: 'admin' | 'cashier'): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    this.setToken(data.token);
    this.setCachedUser(data.user);
    return data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  logout() {
    this.setToken(null);
    this.setCachedUser(null);
  }

  // Users (Admin only)
  async getUsers(): Promise<User[]> {
    const res = await this.request<{ users: User[] }>('/api/users');
    return res.users;
  }

  async createUser(payload: { name: string; email: string; role: 'admin' | 'cashier'; password: string }): Promise<User> {
    const res = await this.request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/api/users/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await this.request<{ categories: Category[] }>('/api/categories');
    return res.categories;
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    const res = await this.request<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return res.category;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const res = await this.request<{ category: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    return res.category;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/api/categories/${id}`, { method: 'DELETE' });
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await this.request<{ products: Product[] }>('/api/products');
    return res.products;
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await this.request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return res.product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await this.request<{ product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.product;
  }

  async adjustStock(id: string, delta: number, reason?: string): Promise<Product> {
    const res = await this.request<{ product: Product }>(`/api/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ delta, reason }),
    });
    return res.product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/api/products/${id}`, { method: 'DELETE' });
  }

  // Sales
  async getSales(filters?: { startDate?: string; endDate?: string; cashierId?: string; status?: string; search?: string }): Promise<Sale[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.cashierId) params.append('cashierId', filters.cashierId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<{ sales: Sale[] }>(`/api/sales${query}`);
    return res.sales;
  }

  async createSale(payload: {
    items: any[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    amountTendered: number;
    changeGiven: number;
    notes?: string;
  }): Promise<Sale> {
    const res = await this.request<{ sale: Sale }>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.sale;
  }

  async refundSale(id: string, action: 'refunded' | 'voided', reason: string): Promise<Sale> {
    const res = await this.request<{ sale: Sale }>(`/api/sales/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
    return res.sale;
  }

  // Reports & AI
  async getReports(): Promise<AIReport[]> {
    const res = await this.request<{ reports: AIReport[] }>('/api/reports');
    return res.reports;
  }

  async generateReport(period: 'daily' | 'weekly' | 'monthly' | 'custom', startDate?: string, endDate?: string): Promise<AIReport> {
    const res = await this.request<{ report: AIReport }>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ period, startDate, endDate }),
    });
    return res.report;
  }

  async deleteReport(id: string): Promise<void> {
    await this.request(`/api/reports/${id}`, { method: 'DELETE' });
  }

  async askAI(question: string): Promise<{ answer: string; suggestedQuestions: string[] }> {
    return this.request<{ answer: string; suggestedQuestions: string[] }>('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getAnalyticsSummary(period?: string, startDate?: string, endDate?: string): Promise<ReportSummary> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await this.request<{ summary: ReportSummary }>(`/api/analytics/summary?${params.toString()}`);
    return res.summary;
  }

  // Settings
  async getSettings(): Promise<any> {
    const res = await this.request<{ settings: any }>('/api/settings');
    return res.settings;
  }

  async updateSettings(settings: any): Promise<any> {
    const res = await this.request<{ settings: any }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return res.settings;
  }
}

export const api = new ApiService();

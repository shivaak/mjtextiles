export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
export type SaleStatus = 'COMPLETED' | 'VOIDED';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

// Product types
export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  description?: string;
  variantCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: number;
  productId: number;
  productName: string;
  productBrand: string;
  productCategory: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  sellingPrice: number;
  avgCost: number;
  stockQty: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type VariantStatus = 'ACTIVE' | 'INACTIVE';

export interface VariantSearchResponse {
  id: number;
  productName: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  sellingPrice: number;
  avgCost: number;
  stockQty: number;
  status: VariantStatus;
}

// Product Request/Response types
export interface CreateProductRequest {
  name: string;
  brand: string;
  category: string;
  description?: string;
}

export interface UpdateProductRequest {
  name: string;
  brand: string;
  category: string;
  description?: string;
}

// Variant Request/Response types
export interface CreateVariantRequest {
  productId: number;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  sellingPrice: number;
  avgCost?: number;
}

export interface UpdateVariantRequest {
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  sellingPrice: number;
  avgCost?: number;
}

export interface UpdateVariantStatusRequest {
  status: VariantStatus;
}

// Pagination
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Suppliers
export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

// Purchases
export interface PurchaseList {
  id: number;
  supplierId: number;
  supplierName: string;
  invoiceNo?: string;
  purchasedAt: string;
  totalCost: number;
  itemCount?: number;
  notes?: string;
  createdBy: number;
  createdByName?: string;
  createdAt?: string;
}

export interface PurchaseItem {
  id: number;
  variantId: number;
  variantSku?: string;
  variantBarcode?: string;
  productName?: string;
  size?: string;
  color?: string;
  qty: number;
  unitCost: number;
  totalCost?: number;
}

export interface PurchaseDetail extends PurchaseList {
  items: PurchaseItem[];
}

export interface CreatePurchaseItemRequest {
  variantId: number;
  qty: number;
  unitCost: number;
}

export interface CreatePurchaseRequest {
  supplierId: number;
  invoiceNo?: string;
  purchasedAt: string;
  notes?: string;
  items: CreatePurchaseItemRequest[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// Sales / Billing
export interface CartItem {
  variantId: number;
  variant: VariantSearchResponse;
  qty: number;
  unitPrice: number;
}

export interface SaleItem {
  id: number;
  variantId: number;
  variantSku?: string;
  variantBarcode?: string;
  productName?: string;
  size?: string;
  color?: string;
  qty: number;
  unitPrice: number;
  unitCostAtSale?: number;
  totalPrice?: number;
}

export interface SaleDetail {
  id: number;
  billNo: string;
  soldAt: string;
  customerName?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  profit?: number;
  status: SaleStatus;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  voidedAt?: string;
  voidedBy?: number;
  voidedByName?: string;
  voidReason?: string;
  items: SaleItem[];
}

export interface SaleList {
  id: number;
  billNo: string;
  soldAt: string;
  customerName?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  profit?: number;
  itemCount?: number;
  status: SaleStatus;
  createdBy: number;
  createdByName?: string;
  createdAt?: string;
}

export interface UserLookup {
  id: number;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface LookupDataResponse {
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  paymentModes: string[];
  adjustmentReasons: string[];
  userRoles: string[];
}

// Dashboard
export interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  avgOrderValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSkus: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
}

export interface TopProduct {
  variantId: number;
  productName: string;
  sku?: string;
  size?: string;
  color?: string;
  qtySold: number;
  revenue: number;
  profit: number;
}

export interface LowStockItem {
  variantId: number;
  productName: string;
  sku?: string;
  size?: string;
  color?: string;
  stockQty: number;
  threshold?: number;
}

export interface RecentSale {
  id: number;
  billNo: string;
  soldAt: string;
  customerName?: string;
  total: number;
  itemCount: number;
  paymentMode: string;
  status: string;
}

// Inventory
export interface InventorySummary {
  totalSkus: number;
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockMovement {
  id: number;
  type: string;
  date: string;
  qty: number;
  referenceId?: number;
  referenceNo?: string;
  supplierName?: string;
  unitCost?: number;
  notes?: string;
}

export interface SupplierSummary {
  supplierId: number;
  supplierName: string;
  totalQty: number;
  purchaseCount: number;
  lastPurchaseDate: string;
  avgUnitCost: number;
}

export interface StockAdjustmentRequest {
  variantId: number;
  deltaQty: number;
  reason: string;
  notes?: string;
}

export interface CreateSaleItemRequest {
  variantId: number;
  qty: number;
  unitPrice: number;
}

export interface CreateSaleRequest {
  customerName?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
  discountPercent: number;
  items: CreateSaleItemRequest[];
}

// Settings
export interface Settings {
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  currency: string;
  taxPercent: number;
  invoicePrefix: string;
  lastBillNumber: number;
  lowStockThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

// Reports
export interface SalesSummaryReport {
  summary: {
    totalSales: number;
    totalProfit: number;
    totalTransactions: number;
    avgOrderValue: number;
  };
  breakdown: Array<{
    period: string;
    sales: number;
    profit: number;
    transactions: number;
    avgOrderValue: number;
  }>;
  paymentModeBreakdown: Array<{
    mode: string;
    amount: number;
    count: number;
  }>;
}

export interface ProductPerformanceReport {
  topSellers: Array<{
    variantId: number;
    productName: string;
    sku?: string;
    category?: string;
    brand?: string;
    qtySold: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
  }>;
  slowMovers: Array<{
    variantId: number;
    productName: string;
    sku?: string;
    qtySold: number;
    daysSinceLastSale?: number;
    stockQty?: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    qtySold: number;
    revenue: number;
    profit: number;
  }>;
}

export interface ProfitReport {
  summary: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
  };
  trend: Array<{
    period: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
  byCategory: Array<{
    category: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
  byCashier: Array<{
    userId: number;
    userName: string;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
}

export interface InventoryValuationReport {
  summary: {
    totalSkus: number;
    totalItems: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialProfit: number;
  };
  byCategory: Array<{
    category: string;
    skuCount: number;
    itemCount: number;
    costValue: number;
    retailValue: number;
  }>;
  byBrand: Array<{
    brand: string;
    skuCount: number;
    itemCount: number;
    costValue: number;
    retailValue: number;
  }>;
}

export interface LowStockReport {
  summary: {
    lowStockCount: number;
    outOfStockCount: number;
    totalReorderValue: number;
  };
  items: Array<{
    variantId: number;
    productName: string;
    sku?: string;
    category?: string;
    brand?: string;
    currentStock: number;
    threshold: number;
    avgMonthlySales?: number;
    suggestedReorder: number;
    lastPurchasePrice?: number;
    reorderCost?: number;
    lastSupplier?: string;
  }>;
}

// Domain types for MJ Textiles Billing + Stock Management System

export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
export type SaleStatus = 'COMPLETED' | 'VOIDED';
export type VariantStatus = 'ACTIVE' | 'INACTIVE';
export type AdjustmentReason = 'OPENING_STOCK' | 'DAMAGE' | 'THEFT' | 'CORRECTION' | 'RETURN' | 'OTHER';

export interface User {
  id: string;
  username: string;
  password: string; // Plain text for demo
  role: UserRole;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  sellingPrice: number;
  avgCost: number;
  stockQty: number;
  status: VariantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  purchasedAt: string;
  invoiceNo?: string;
  totalCost: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  variantId: string;
  qty: number;
  unitCost: number;
}

export interface Sale {
  id: string;
  billNo: string;
  soldAt: string;
  customerName?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  status: SaleStatus;
  createdBy: string;
  createdAt: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  variantId: string;
  qty: number;
  unitPrice: number;
  unitCostAtSale: number;
}

export interface StockAdjustment {
  id: string;
  variantId: string;
  deltaQty: number;
  reason: AdjustmentReason;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Settings {
  shopName: string;
  address: string;
  phone: string;
  email?: string;
  currency: string;
  currencySymbol: string;
  taxPercent: number;
  invoicePrefix: string;
  lowStockThreshold: number;
  lastBillNumber: number;
}

// Computed/View types
export interface VariantWithProduct extends Variant {
  productName: string;
  productBrand: string;
  productCategory: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItemWithVariant[];
  profit?: number;
}

export interface SaleItemWithVariant extends SaleItem {
  variant: VariantWithProduct;
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItemWithVariant[];
  supplierName: string;
}

export interface PurchaseItemWithVariant extends PurchaseItem {
  variant: VariantWithProduct;
}

export interface StockMovement {
  id: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'VOID_RESTORE';
  date: string;
  qty: number;
  referenceId: string;
  referenceNo?: string;
  notes?: string;
  supplierName?: string;
  unitCost?: number;
}

export interface VariantSupplierSummary {
  supplierId: string;
  supplierName: string;
  totalQty: number;
  purchaseCount: number;
  lastPurchaseDate: string;
  avgUnitCost: number;
}

// Dashboard/Report types
export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  lowStockCount: number;
  totalSkus: number;
  monthlySales: number;
  monthlyProfit: number;
}

export interface SalesTrendData {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalQty: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface CategorySales {
  category: string;
  totalSales: number;
  totalProfit: number;
  itemsSold: number;
}

// Auth types
export interface AuthSession {
  userId: string;
  username: string;
  role: UserRole;
  fullName: string;
  loginAt: string;
}

// Form types
export interface CartItem {
  variantId: string;
  variant: VariantWithProduct;
  qty: number;
  unitPrice: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

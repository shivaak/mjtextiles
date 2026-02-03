export type UserRole = 'ADMIN' | 'EMPLOYEE';

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

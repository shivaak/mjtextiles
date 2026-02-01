// localStorage wrapper with versioning support
// This layer can be swapped to API calls when connecting to backend

const STORAGE_VERSION = '1.0.0';
const VERSION_KEY = 'mj_textiles_version';

export interface StorageData<T> {
  data: T;
  updatedAt: string;
}

/**
 * Get data from localStorage
 */
export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsed: StorageData<T> = JSON.parse(item);
    return parsed.data;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
}

/**
 * Set data in localStorage
 */
export function setStorageItem<T>(key: string, data: T): void {
  try {
    const item: StorageData<T> = {
      data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    throw new Error('Failed to save data');
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

/**
 * Check storage version and clear if outdated
 */
export function checkStorageVersion(): boolean {
  const version = localStorage.getItem(VERSION_KEY);
  if (version !== STORAGE_VERSION) {
    return false;
  }
  return true;
}

/**
 * Set storage version
 */
export function setStorageVersion(): void {
  localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
}

/**
 * Clear all app data from localStorage
 */
export function clearAllStorage(): void {
  const keysToRemove = [
    'mj_users',
    'mj_products',
    'mj_variants',
    'mj_suppliers',
    'mj_purchases',
    'mj_purchase_items',
    'mj_sales',
    'mj_sale_items',
    'mj_stock_adjustments',
    'mj_settings',
    'mj_session',
    VERSION_KEY,
  ];
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Check if data is seeded
 */
export function isDataSeeded(): boolean {
  return localStorage.getItem('mj_users') !== null;
}

// Storage keys constants
export const STORAGE_KEYS = {
  USERS: 'mj_users',
  PRODUCTS: 'mj_products',
  VARIANTS: 'mj_variants',
  SUPPLIERS: 'mj_suppliers',
  PURCHASES: 'mj_purchases',
  PURCHASE_ITEMS: 'mj_purchase_items',
  SALES: 'mj_sales',
  SALE_ITEMS: 'mj_sale_items',
  STOCK_ADJUSTMENTS: 'mj_stock_adjustments',
  SETTINGS: 'mj_settings',
  SESSION: 'mj_session',
} as const;

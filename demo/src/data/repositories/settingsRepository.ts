// Settings repository - Shop settings management

import type { Settings } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';

const DEFAULT_SETTINGS: Settings = {
  shopName: 'MJ Textiles',
  address: '123 Main Street, City Center, Mumbai 400001',
  phone: '+91 98765 43210',
  email: 'contact@mjtextiles.com',
  currency: 'INR',
  currencySymbol: '₹',
  taxPercent: 5,
  invoicePrefix: 'MJT',
  lowStockThreshold: 10,
  lastBillNumber: 0,
};

export function getSettings(): Settings {
  return getStorageItem<Settings>(STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS;
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const current = getSettings();
  const updated = { ...current, ...updates };
  setStorageItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

export function resetSettings(): Settings {
  setStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function initializeSettings(): void {
  const existing = getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);
  if (!existing) {
    setStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
}

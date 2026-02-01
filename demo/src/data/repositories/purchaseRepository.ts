// Purchase repository - CRUD operations for purchases

import { v4 as uuidv4 } from 'uuid';
import type { Purchase, PurchaseItem, PurchaseWithItems, PurchaseItemWithVariant } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';
import { updateVariantStock, getVariantWithProduct } from './variantRepository';
import { getSupplierById } from './supplierRepository';

export function getAllPurchases(): Purchase[] {
  return getStorageItem<Purchase[]>(STORAGE_KEYS.PURCHASES) || [];
}

export function getAllPurchaseItems(): PurchaseItem[] {
  return getStorageItem<PurchaseItem[]>(STORAGE_KEYS.PURCHASE_ITEMS) || [];
}

export function getPurchaseById(id: string): Purchase | undefined {
  const purchases = getAllPurchases();
  return purchases.find(p => p.id === id);
}

export function getPurchaseItems(purchaseId: string): PurchaseItem[] {
  const items = getAllPurchaseItems();
  return items.filter(i => i.purchaseId === purchaseId);
}

export function getPurchaseWithItems(id: string): PurchaseWithItems | undefined {
  const purchase = getPurchaseById(id);
  if (!purchase) return undefined;

  const items = getPurchaseItems(id);
  const supplier = getSupplierById(purchase.supplierId);

  const itemsWithVariants: PurchaseItemWithVariant[] = items.map(item => {
    const variant = getVariantWithProduct(item.variantId);
    return {
      ...item,
      variant: variant!,
    };
  }).filter(item => item.variant);

  return {
    ...purchase,
    items: itemsWithVariants,
    supplierName: supplier?.name || 'Unknown',
  };
}

export function getAllPurchasesWithItems(): PurchaseWithItems[] {
  const purchases = getAllPurchases();
  return purchases.map(p => getPurchaseWithItems(p.id)!).filter(Boolean);
}

interface CreatePurchaseData {
  supplierId: string;
  purchasedAt: string;
  invoiceNo?: string;
  notes?: string;
  createdBy: string;
  items: Array<{
    variantId: string;
    qty: number;
    unitCost: number;
  }>;
}

export function createPurchase(data: CreatePurchaseData): Purchase {
  const purchases = getAllPurchases();
  const purchaseItems = getAllPurchaseItems();
  const now = new Date().toISOString();

  // Calculate total cost
  const totalCost = data.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

  const newPurchase: Purchase = {
    id: uuidv4(),
    supplierId: data.supplierId,
    purchasedAt: data.purchasedAt,
    invoiceNo: data.invoiceNo,
    totalCost,
    notes: data.notes,
    createdBy: data.createdBy,
    createdAt: now,
  };

  // Create purchase items and update stock
  const newItems: PurchaseItem[] = data.items.map(item => ({
    id: uuidv4(),
    purchaseId: newPurchase.id,
    variantId: item.variantId,
    qty: item.qty,
    unitCost: item.unitCost,
  }));

  // Update stock for each item
  for (const item of data.items) {
    updateVariantStock(item.variantId, item.qty, item.unitCost);
  }

  // Save purchase and items
  setStorageItem(STORAGE_KEYS.PURCHASES, [...purchases, newPurchase]);
  setStorageItem(STORAGE_KEYS.PURCHASE_ITEMS, [...purchaseItems, ...newItems]);

  return newPurchase;
}

export function getPurchasesByDateRange(startDate: string, endDate: string): Purchase[] {
  const purchases = getAllPurchases();
  return purchases.filter(p => p.purchasedAt >= startDate && p.purchasedAt <= endDate);
}

export function getPurchasesBySupplier(supplierId: string): Purchase[] {
  const purchases = getAllPurchases();
  return purchases.filter(p => p.supplierId === supplierId);
}

export function deletePurchase(id: string): void {
  // Note: This doesn't reverse stock changes - for audit purposes
  const purchases = getAllPurchases();
  const purchaseItems = getAllPurchaseItems();
  
  setStorageItem(STORAGE_KEYS.PURCHASES, purchases.filter(p => p.id !== id));
  setStorageItem(STORAGE_KEYS.PURCHASE_ITEMS, purchaseItems.filter(i => i.purchaseId !== id));
}

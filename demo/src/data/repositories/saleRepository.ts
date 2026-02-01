// Sale repository - CRUD operations for sales

import { v4 as uuidv4 } from 'uuid';
import type { Sale, SaleItem, SaleWithItems, SaleItemWithVariant, PaymentMode } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';
import { updateVariantStock, getVariantWithProduct, getVariantById } from './variantRepository';
import { getSettings, updateSettings } from './settingsRepository';
import { generateBillNumber, calculateSaleProfit } from '../../domain/calculations';

export function getAllSales(): Sale[] {
  return getStorageItem<Sale[]>(STORAGE_KEYS.SALES) || [];
}

export function getAllSaleItems(): SaleItem[] {
  return getStorageItem<SaleItem[]>(STORAGE_KEYS.SALE_ITEMS) || [];
}

export function getSaleById(id: string): Sale | undefined {
  const sales = getAllSales();
  return sales.find(s => s.id === id);
}

export function getSaleByBillNo(billNo: string): Sale | undefined {
  const sales = getAllSales();
  return sales.find(s => s.billNo === billNo);
}

export function getSaleItems(saleId: string): SaleItem[] {
  const items = getAllSaleItems();
  return items.filter(i => i.saleId === saleId);
}

export function getSaleWithItems(id: string): SaleWithItems | undefined {
  const sale = getSaleById(id);
  if (!sale) return undefined;

  const items = getSaleItems(id);

  const itemsWithVariants: SaleItemWithVariant[] = items.map(item => {
    const variant = getVariantWithProduct(item.variantId);
    return {
      ...item,
      variant: variant!,
    };
  }).filter(item => item.variant);

  const profit = sale.status === 'COMPLETED' ? calculateSaleProfit(items) : 0;

  return {
    ...sale,
    items: itemsWithVariants,
    profit,
  };
}

export function getAllSalesWithItems(): SaleWithItems[] {
  const sales = getAllSales();
  return sales.map(s => getSaleWithItems(s.id)!).filter(Boolean);
}

interface CreateSaleData {
  customerName?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  createdBy: string;
  items: Array<{
    variantId: string;
    qty: number;
    unitPrice: number;
  }>;
}

export function createSale(data: CreateSaleData): Sale {
  console.log('Creating sale with data:', data);
  
  const sales = getAllSales();
  const saleItems = getAllSaleItems();
  const settings = getSettings();
  const now = new Date().toISOString();
  
  console.log('Current sales count:', sales.length);
  console.log('Settings:', settings);

  // Generate bill number
  const billNo = generateBillNumber(settings.invoicePrefix, settings.lastBillNumber);

  const newSale: Sale = {
    id: uuidv4(),
    billNo,
    soldAt: now,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    paymentMode: data.paymentMode,
    subtotal: data.subtotal,
    discountAmount: data.discountAmount,
    discountPercent: data.discountPercent,
    taxAmount: data.taxAmount,
    taxPercent: data.taxPercent,
    total: data.total,
    status: 'COMPLETED',
    createdBy: data.createdBy,
    createdAt: now,
  };

  // Create sale items and update stock
  const newItems: SaleItem[] = data.items.map(item => {
    const variant = getVariantById(item.variantId);
    return {
      id: uuidv4(),
      saleId: newSale.id,
      variantId: item.variantId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      unitCostAtSale: variant?.avgCost || 0,
    };
  });

  // Update stock for each item (decrease)
  for (const item of data.items) {
    updateVariantStock(item.variantId, -item.qty);
  }

  // Update last bill number
  updateSettings({ lastBillNumber: settings.lastBillNumber + 1 });

  // Save sale and items
  const updatedSales = [...sales, newSale];
  const updatedSaleItems = [...saleItems, ...newItems];
  
  console.log('Saving sales:', updatedSales.length, 'items');
  console.log('New sale:', newSale);
  
  setStorageItem(STORAGE_KEYS.SALES, updatedSales);
  setStorageItem(STORAGE_KEYS.SALE_ITEMS, updatedSaleItems);
  
  // Verify save
  const verifyCount = getAllSales().length;
  console.log('Verified sales count after save:', verifyCount);

  return newSale;
}

export function voidSale(id: string, voidedBy: string, reason: string): Sale {
  const sales = getAllSales();
  const index = sales.findIndex(s => s.id === id);
  
  if (index === -1) {
    throw new Error('Sale not found');
  }

  const sale = sales[index];
  if (sale.status === 'VOIDED') {
    throw new Error('Sale is already voided');
  }

  // Restore stock
  const items = getSaleItems(id);
  for (const item of items) {
    updateVariantStock(item.variantId, item.qty); // Add back
  }

  // Update sale status
  const updatedSale: Sale = {
    ...sale,
    status: 'VOIDED',
    voidedAt: new Date().toISOString(),
    voidedBy,
    voidReason: reason,
  };

  sales[index] = updatedSale;
  setStorageItem(STORAGE_KEYS.SALES, sales);

  return updatedSale;
}

export function getSalesByDateRange(startDate: string, endDate: string): Sale[] {
  const sales = getAllSales();
  return sales.filter(s => s.soldAt >= startDate && s.soldAt <= endDate);
}

export function getSalesByPaymentMode(paymentMode: PaymentMode): Sale[] {
  const sales = getAllSales();
  return sales.filter(s => s.paymentMode === paymentMode);
}

export function getSalesByCashier(createdBy: string): Sale[] {
  const sales = getAllSales();
  return sales.filter(s => s.createdBy === createdBy);
}

export function getCompletedSales(): Sale[] {
  const sales = getAllSales();
  return sales.filter(s => s.status === 'COMPLETED');
}

export function getRecentSales(limit: number): SaleWithItems[] {
  const sales = getAllSales()
    .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
    .slice(0, limit);
  
  return sales.map(s => getSaleWithItems(s.id)!).filter(Boolean);
}

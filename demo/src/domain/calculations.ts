// Business logic calculations for MJ Textiles

import type { CartItem, SaleItem, Variant } from './types';

/**
 * Calculate weighted average cost when adding new stock
 * Formula: (currentQty * currentAvgCost + newQty * newUnitCost) / (currentQty + newQty)
 */
export function calculateWeightedAvgCost(
  currentQty: number,
  currentAvgCost: number,
  newQty: number,
  newUnitCost: number
): number {
  if (currentQty + newQty === 0) return 0;
  const totalValue = currentQty * currentAvgCost + newQty * newUnitCost;
  return Math.round((totalValue / (currentQty + newQty)) * 100) / 100;
}

/**
 * Calculate profit for a sale item
 */
export function calculateItemProfit(item: SaleItem): number {
  return (item.unitPrice - item.unitCostAtSale) * item.qty;
}

/**
 * Calculate total profit for a sale
 */
export function calculateSaleProfit(items: SaleItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemProfit(item), 0);
}

/**
 * Calculate subtotal from cart items
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

/**
 * Calculate discount amount from percentage
 */
export function calculateDiscountAmount(subtotal: number, discountPercent: number): number {
  return Math.round((subtotal * discountPercent) / 100 * 100) / 100;
}

/**
 * Calculate tax amount
 */
export function calculateTaxAmount(amountAfterDiscount: number, taxPercent: number): number {
  return Math.round((amountAfterDiscount * taxPercent) / 100 * 100) / 100;
}

/**
 * Calculate grand total
 */
export function calculateGrandTotal(
  subtotal: number,
  discountAmount: number,
  taxAmount: number
): number {
  return Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;
}

/**
 * Calculate stock value for a variant
 */
export function calculateStockValue(variant: Variant): number {
  return Math.round(variant.stockQty * variant.avgCost * 100) / 100;
}

/**
 * Calculate margin percentage (Profit / Selling Price)
 * Example: Cost=100, Price=150 → Margin = 50/150 = 33.3%
 */
export function calculateMarginPercent(sellingPrice: number, cost: number): number {
  if (sellingPrice === 0) return 0;
  return Math.round(((sellingPrice - cost) / sellingPrice) * 100 * 100) / 100;
}

/**
 * Calculate markup percentage (Profit / Cost)
 * Example: Cost=100, Price=150 → Markup = 50/100 = 50%
 */
export function calculateMarkupPercent(sellingPrice: number, cost: number): number {
  if (cost === 0) return 0;
  return Math.round(((sellingPrice - cost) / cost) * 100 * 100) / 100;
}

/**
 * Generate next bill number
 */
export function generateBillNumber(prefix: string, lastNumber: number): string {
  const nextNumber = lastNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Check if stock is low
 */
export function isLowStock(stockQty: number, threshold: number): boolean {
  return stockQty <= threshold;
}

/**
 * Validate barcode uniqueness
 */
export function isBarcodeUnique(barcode: string, variants: Variant[], excludeId?: string): boolean {
  return !variants.some(v => v.barcode === barcode && v.id !== excludeId);
}

/**
 * Validate SKU uniqueness
 */
export function isSkuUnique(sku: string, variants: Variant[], excludeId?: string): boolean {
  return !variants.some(v => v.sku === sku && v.id !== excludeId);
}

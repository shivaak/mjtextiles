/**
 * Calculate margin percentage (Profit / Selling Price)
 * Example: Cost=100, Price=150 → Margin = 50/150 = 33.3%
 */
export function calculateMarginPercent(sellingPrice: number, cost: number): number {
  if (sellingPrice === 0) return 0;
  return Math.round(((sellingPrice - cost) / sellingPrice) * 100 * 100) / 100;
}

/**
 * Format currency with symbol
 * Default: Indian Rupee (₹)
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Check if stock is low based on threshold
 */
export function isLowStock(stockQty: number, threshold: number): boolean {
  return stockQty > 0 && stockQty <= threshold;
}

/**
 * Check if stock is out
 */
export function isOutOfStock(stockQty: number): boolean {
  return stockQty === 0;
}

/**
 * Calculate subtotal from cart items
 */
export function calculateSubtotal(items: { qty: number; unitPrice: number }[]): number {
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
export function calculateStockValue(variant: { stockQty: number; avgCost: number }): number {
  return Math.round(variant.stockQty * variant.avgCost * 100) / 100;
}

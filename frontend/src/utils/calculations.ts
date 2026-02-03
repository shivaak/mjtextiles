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

// Stock Adjustment repository - CRUD operations for stock adjustments

import { v4 as uuidv4 } from 'uuid';
import type { StockAdjustment, AdjustmentReason } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';
import { updateVariantStock } from './variantRepository';

export function getAllStockAdjustments(): StockAdjustment[] {
  return getStorageItem<StockAdjustment[]>(STORAGE_KEYS.STOCK_ADJUSTMENTS) || [];
}

export function getStockAdjustmentById(id: string): StockAdjustment | undefined {
  const adjustments = getAllStockAdjustments();
  return adjustments.find(a => a.id === id);
}

export function getStockAdjustmentsByVariant(variantId: string): StockAdjustment[] {
  const adjustments = getAllStockAdjustments();
  return adjustments.filter(a => a.variantId === variantId);
}

interface CreateAdjustmentData {
  variantId: string;
  deltaQty: number;
  reason: AdjustmentReason;
  notes?: string;
  createdBy: string;
}

export function createStockAdjustment(data: CreateAdjustmentData): StockAdjustment {
  const adjustments = getAllStockAdjustments();

  const newAdjustment: StockAdjustment = {
    id: uuidv4(),
    variantId: data.variantId,
    deltaQty: data.deltaQty,
    reason: data.reason,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy,
  };

  // Update variant stock
  updateVariantStock(data.variantId, data.deltaQty);

  setStorageItem(STORAGE_KEYS.STOCK_ADJUSTMENTS, [...adjustments, newAdjustment]);
  return newAdjustment;
}

export function getAdjustmentsByDateRange(startDate: string, endDate: string): StockAdjustment[] {
  const adjustments = getAllStockAdjustments();
  return adjustments.filter(a => a.createdAt >= startDate && a.createdAt <= endDate);
}

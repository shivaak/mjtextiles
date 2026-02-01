// Variant repository - CRUD operations for product variants

import { v4 as uuidv4 } from 'uuid';
import type { Variant, VariantWithProduct, VariantStatus } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';
import { getAllProducts } from './productRepository';
import { calculateWeightedAvgCost } from '../../domain/calculations';

export function getAllVariants(): Variant[] {
  return getStorageItem<Variant[]>(STORAGE_KEYS.VARIANTS) || [];
}

export function getVariantById(id: string): Variant | undefined {
  const variants = getAllVariants();
  return variants.find(v => v.id === id);
}

export function getVariantByBarcode(barcode: string): Variant | undefined {
  const variants = getAllVariants();
  return variants.find(v => v.barcode === barcode);
}

export function getVariantBySku(sku: string): Variant | undefined {
  const variants = getAllVariants();
  return variants.find(v => v.sku === sku);
}

export function getVariantsByProductId(productId: string): Variant[] {
  const variants = getAllVariants();
  return variants.filter(v => v.productId === productId);
}

export function getActiveVariants(): Variant[] {
  const variants = getAllVariants();
  return variants.filter(v => v.status === 'ACTIVE');
}

export function getLowStockVariants(threshold: number): Variant[] {
  const variants = getActiveVariants();
  return variants.filter(v => v.stockQty <= threshold);
}

export function getVariantWithProduct(variantId: string): VariantWithProduct | undefined {
  const variant = getVariantById(variantId);
  if (!variant) return undefined;

  const products = getAllProducts();
  const product = products.find(p => p.id === variant.productId);
  if (!product) return undefined;

  return {
    ...variant,
    productName: product.name,
    productBrand: product.brand,
    productCategory: product.category,
  };
}

export function getAllVariantsWithProducts(): VariantWithProduct[] {
  const variants = getAllVariants();
  const products = getAllProducts();

  return variants.map(variant => {
    const product = products.find(p => p.id === variant.productId);
    return {
      ...variant,
      productName: product?.name || 'Unknown',
      productBrand: product?.brand || 'Unknown',
      productCategory: product?.category || 'Unknown',
    };
  });
}

export function createVariant(variantData: Omit<Variant, 'id' | 'createdAt' | 'updatedAt'>): Variant {
  const variants = getAllVariants();
  const now = new Date().toISOString();

  // Check barcode uniqueness
  if (variants.some(v => v.barcode === variantData.barcode)) {
    throw new Error('Barcode already exists');
  }

  // Check SKU uniqueness
  if (variants.some(v => v.sku === variantData.sku)) {
    throw new Error('SKU already exists');
  }

  const newVariant: Variant = {
    ...variantData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  setStorageItem(STORAGE_KEYS.VARIANTS, [...variants, newVariant]);
  return newVariant;
}

export function updateVariant(id: string, updates: Partial<Omit<Variant, 'id' | 'createdAt'>>): Variant {
  const variants = getAllVariants();
  const index = variants.findIndex(v => v.id === id);
  
  if (index === -1) {
    throw new Error('Variant not found');
  }

  // Check barcode uniqueness if updating
  if (updates.barcode && variants.some(v => v.barcode === updates.barcode && v.id !== id)) {
    throw new Error('Barcode already exists');
  }

  // Check SKU uniqueness if updating
  if (updates.sku && variants.some(v => v.sku === updates.sku && v.id !== id)) {
    throw new Error('SKU already exists');
  }

  const updatedVariant = { 
    ...variants[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  variants[index] = updatedVariant;
  setStorageItem(STORAGE_KEYS.VARIANTS, variants);
  return updatedVariant;
}

export function updateVariantStock(
  id: string, 
  qtyDelta: number, 
  newUnitCost?: number
): Variant {
  const variants = getAllVariants();
  const index = variants.findIndex(v => v.id === id);
  
  if (index === -1) {
    throw new Error('Variant not found');
  }

  const variant = variants[index];
  const newQty = variant.stockQty + qtyDelta;

  if (newQty < 0) {
    throw new Error('Insufficient stock');
  }

  let newAvgCost = variant.avgCost;
  if (newUnitCost !== undefined && qtyDelta > 0) {
    newAvgCost = calculateWeightedAvgCost(
      variant.stockQty, 
      variant.avgCost, 
      qtyDelta, 
      newUnitCost
    );
  }

  const updatedVariant = { 
    ...variant, 
    stockQty: newQty,
    avgCost: newAvgCost,
    updatedAt: new Date().toISOString() 
  };
  variants[index] = updatedVariant;
  setStorageItem(STORAGE_KEYS.VARIANTS, variants);
  return updatedVariant;
}

export function setVariantStatus(id: string, status: VariantStatus): Variant {
  return updateVariant(id, { status });
}

export function deleteVariant(id: string): void {
  const variants = getAllVariants();
  const filtered = variants.filter(v => v.id !== id);
  setStorageItem(STORAGE_KEYS.VARIANTS, filtered);
}

export function searchVariants(query: string): VariantWithProduct[] {
  const variants = getAllVariantsWithProducts();
  const lowerQuery = query.toLowerCase();
  return variants.filter(v => 
    v.barcode.toLowerCase().includes(lowerQuery) ||
    v.sku.toLowerCase().includes(lowerQuery) ||
    v.productName.toLowerCase().includes(lowerQuery) ||
    v.productBrand.toLowerCase().includes(lowerQuery) ||
    v.color.toLowerCase().includes(lowerQuery) ||
    v.size.toLowerCase().includes(lowerQuery)
  );
}

// Product repository - CRUD operations for products

import { v4 as uuidv4 } from 'uuid';
import type { Product } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';

export function getAllProducts(): Product[] {
  return getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
}

export function getProductById(id: string): Product | undefined {
  const products = getAllProducts();
  return products.find(p => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  const products = getAllProducts();
  return products.filter(p => p.category === category);
}

export function getProductsByBrand(brand: string): Product[] {
  const products = getAllProducts();
  return products.filter(p => p.brand === brand);
}

export function getCategories(): string[] {
  const products = getAllProducts();
  return [...new Set(products.map(p => p.category))].sort();
}

export function getBrands(): string[] {
  const products = getAllProducts();
  return [...new Set(products.map(p => p.brand))].sort();
}

export function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const products = getAllProducts();
  const now = new Date().toISOString();

  const newProduct: Product = {
    ...productData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  setStorageItem(STORAGE_KEYS.PRODUCTS, [...products, newProduct]);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product {
  const products = getAllProducts();
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('Product not found');
  }

  const updatedProduct = { 
    ...products[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  products[index] = updatedProduct;
  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
  return updatedProduct;
}

export function deleteProduct(id: string): void {
  const products = getAllProducts();
  const filtered = products.filter(p => p.id !== id);
  setStorageItem(STORAGE_KEYS.PRODUCTS, filtered);
}

export function searchProducts(query: string): Product[] {
  const products = getAllProducts();
  const lowerQuery = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.brand.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery)
  );
}

// Supplier repository - CRUD operations for suppliers

import { v4 as uuidv4 } from 'uuid';
import type { Supplier } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';

export function getAllSuppliers(): Supplier[] {
  return getStorageItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS) || [];
}

export function getSupplierById(id: string): Supplier | undefined {
  const suppliers = getAllSuppliers();
  return suppliers.find(s => s.id === id);
}

export function createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
  const suppliers = getAllSuppliers();

  const newSupplier: Supplier = {
    ...supplierData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  setStorageItem(STORAGE_KEYS.SUPPLIERS, [...suppliers, newSupplier]);
  return newSupplier;
}

export function updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Supplier {
  const suppliers = getAllSuppliers();
  const index = suppliers.findIndex(s => s.id === id);
  
  if (index === -1) {
    throw new Error('Supplier not found');
  }

  const updatedSupplier = { ...suppliers[index], ...updates };
  suppliers[index] = updatedSupplier;
  setStorageItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  return updatedSupplier;
}

export function deleteSupplier(id: string): void {
  const suppliers = getAllSuppliers();
  const filtered = suppliers.filter(s => s.id !== id);
  setStorageItem(STORAGE_KEYS.SUPPLIERS, filtered);
}

export function searchSuppliers(query: string): Supplier[] {
  const suppliers = getAllSuppliers();
  const lowerQuery = query.toLowerCase();
  return suppliers.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) ||
    (s.phone && s.phone.includes(query))
  );
}

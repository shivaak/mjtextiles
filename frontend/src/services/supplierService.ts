import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  Supplier,
  CreateSupplierRequest,
} from '../domain/types';

export const supplierService = {
  async getSuppliers(params?: { search?: string }): Promise<Supplier[]> {
    const response = await api.get<ApiResponse<Supplier[]>>('/suppliers', { params });
    return unwrapApiResponse(response);
  },

  async getSupplierById(id: number): Promise<Supplier> {
    const response = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return unwrapApiResponse(response);
  },

  async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    const response = await api.post<ApiResponse<Supplier>>('/suppliers', data);
    return unwrapApiResponse(response);
  },
};

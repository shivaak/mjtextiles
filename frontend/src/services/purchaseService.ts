import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  PurchaseDetail,
  PurchaseList,
  CreatePurchaseRequest,
} from '../domain/types';

export const purchaseService = {
  async getPurchases(params?: {
    supplierId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PurchaseList[]> {
    const response = await api.get<ApiResponse<PurchaseList[]>>('/purchases', { params });
    return unwrapApiResponse(response);
  },

  async getPurchaseById(id: number): Promise<PurchaseDetail> {
    const response = await api.get<ApiResponse<PurchaseDetail>>(`/purchases/${id}`);
    return unwrapApiResponse(response);
  },

  async createPurchase(data: CreatePurchaseRequest): Promise<PurchaseDetail> {
    const response = await api.post<ApiResponse<PurchaseDetail>>('/purchases', data);
    return unwrapApiResponse(response);
  },
};

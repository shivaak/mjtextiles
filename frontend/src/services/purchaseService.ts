import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  PurchaseDetail,
  PurchaseList,
  CreatePurchaseRequest,
  UpdatePurchaseMetadataRequest,
  UpdatePurchaseItemsRequest,
  VoidPurchaseRequest,
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

  async voidPurchase(id: number, data: VoidPurchaseRequest): Promise<void> {
    const response = await api.put<ApiResponse<void>>(`/purchases/${id}/void`, data);
    unwrapApiResponse(response, { allowEmptyData: true });
  },

  async updatePurchaseMetadata(id: number, data: UpdatePurchaseMetadataRequest): Promise<PurchaseDetail> {
    const response = await api.patch<ApiResponse<PurchaseDetail>>(`/purchases/${id}/metadata`, data);
    return unwrapApiResponse(response);
  },

  async updatePurchaseItems(id: number, data: UpdatePurchaseItemsRequest): Promise<PurchaseDetail> {
    const response = await api.put<ApiResponse<PurchaseDetail>>(`/purchases/${id}/items`, data);
    return unwrapApiResponse(response);
  },
};

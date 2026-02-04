import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  InventorySummary,
  StockMovement,
  SupplierSummary,
  StockAdjustmentRequest,
} from '../domain/types';

export const inventoryService = {
  async getSummary(): Promise<InventorySummary> {
    const response = await api.get<ApiResponse<InventorySummary>>('/inventory/summary');
    return unwrapApiResponse(response);
  },

  async getMovements(params: {
    variantId: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<StockMovement[]> {
    const { variantId, ...query } = params;
    const response = await api.get<ApiResponse<StockMovement[]>>(`/inventory/movements/${variantId}`, {
      params: query,
    });
    return unwrapApiResponse(response);
  },

  async getSupplierSummary(variantId: number): Promise<SupplierSummary[]> {
    const response = await api.get<ApiResponse<SupplierSummary[]>>(`/inventory/suppliers/${variantId}`);
    return unwrapApiResponse(response);
  },

  async createAdjustment(data: StockAdjustmentRequest): Promise<void> {
    const response = await api.post<ApiResponse<void>>('/inventory/adjustments', data);
    unwrapApiResponse(response, { allowEmptyData: true });
  },
};

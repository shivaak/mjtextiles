import api, { unwrapApiResponse } from './api';
import type { ApiResponse, CreateSaleRequest, SaleDetail, SaleList, PagedResponse } from '../domain/types';

export const saleService = {
  async createSale(data: CreateSaleRequest): Promise<SaleDetail> {
    const response = await api.post<ApiResponse<SaleDetail>>('/sales', data);
    return unwrapApiResponse(response);
  },

  async getSales(params?: {
    startDate?: string;
    endDate?: string;
    paymentMode?: string;
    status?: string;
    createdBy?: number;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<SaleList>> {
    const response = await api.get<ApiResponse<PagedResponse<SaleList>>>('/sales', { params });
    return unwrapApiResponse(response);
  },
};

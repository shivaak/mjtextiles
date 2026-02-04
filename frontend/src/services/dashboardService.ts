import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  DashboardStats,
  SalesTrend,
  TopProduct,
  LowStockItem,
  RecentSale,
} from '../domain/types';

export const dashboardService = {
  async getStats(params?: { period?: string; startDate?: string; endDate?: string }): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats', { params });
    return unwrapApiResponse(response);
  },

  async getSalesTrend(params?: { days?: number }): Promise<SalesTrend[]> {
    const response = await api.get<ApiResponse<SalesTrend[]>>('/dashboard/sales-trend', { params });
    return unwrapApiResponse(response);
  },

  async getTopProducts(params?: { period?: string; limit?: number }): Promise<TopProduct[]> {
    const response = await api.get<ApiResponse<TopProduct[]>>('/dashboard/top-products', { params });
    return unwrapApiResponse(response);
  },

  async getLowStock(params?: { limit?: number }): Promise<LowStockItem[]> {
    const response = await api.get<ApiResponse<LowStockItem[]>>('/dashboard/low-stock', { params });
    return unwrapApiResponse(response);
  },

  async getRecentSales(params?: { limit?: number }): Promise<RecentSale[]> {
    const response = await api.get<ApiResponse<RecentSale[]>>('/dashboard/recent-sales', { params });
    return unwrapApiResponse(response);
  },
};

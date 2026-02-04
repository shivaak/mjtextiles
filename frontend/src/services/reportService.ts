import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  SalesSummaryReport,
  ProductPerformanceReport,
  ProfitReport,
  InventoryValuationReport,
  LowStockReport,
} from '../domain/types';

export type ReportExportParams = {
  reportType: 'sales-summary' | 'product-performance' | 'profit' | 'inventory-valuation' | 'low-stock';
  format?: 'csv';
  startDate?: string;
  endDate?: string;
  category?: string;
  brand?: string;
  groupBy?: 'day' | 'week' | 'month' | string;
};

export const reportService = {
  async getSalesSummary(params: { startDate: string; endDate: string; groupBy?: 'day' | 'week' | 'month' }) {
    const response = await api.get<ApiResponse<SalesSummaryReport>>('/reports/sales-summary', { params });
    return unwrapApiResponse(response);
  },

  async getProductPerformance(params: {
    startDate: string;
    endDate: string;
    category?: string;
    brand?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    limit?: number;
  }) {
    const response = await api.get<ApiResponse<ProductPerformanceReport>>('/reports/product-performance', { params });
    return unwrapApiResponse(response);
  },

  async getProfit(params: { startDate: string; endDate: string; groupBy?: 'day' | 'week' | 'month' }) {
    const response = await api.get<ApiResponse<ProfitReport>>('/reports/profit', { params });
    return unwrapApiResponse(response);
  },

  async getInventoryValuation(params?: { category?: string; brand?: string; groupBy?: string }) {
    const response = await api.get<ApiResponse<InventoryValuationReport>>('/reports/inventory-valuation', { params });
    return unwrapApiResponse(response);
  },

  async getLowStock(params?: { category?: string; brand?: string; includeOutOfStock?: boolean }) {
    const response = await api.get<ApiResponse<LowStockReport>>('/reports/low-stock', { params });
    return unwrapApiResponse(response);
  },

  async exportReport(params: ReportExportParams): Promise<Blob> {
    const response = await api.get('/reports/export', { params, responseType: 'blob' });
    return response.data as Blob;
  },
};

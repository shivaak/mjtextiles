import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerPointsLog,
  CustomerAnalyticsSummary,
  CustomerRanking,
  AreaDistribution,
  MonthlyCustomerTrend,
  PurchaseFrequency,
} from '../domain/types';

export const customerService = {
  async getCustomers(params?: { search?: string }): Promise<Customer[]> {
    const response = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return unwrapApiResponse(response);
  },

  async getCustomerById(id: number): Promise<Customer> {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return unwrapApiResponse(response);
  },

  async getCustomerByPhone(phone: string): Promise<Customer> {
    const response = await api.get<ApiResponse<Customer>>(`/customers/phone/${encodeURIComponent(phone)}`);
    return unwrapApiResponse(response);
  },

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return unwrapApiResponse(response);
  },

  async updateCustomer(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return unwrapApiResponse(response);
  },

  async getPointsHistory(customerId: number): Promise<CustomerPointsLog[]> {
    const response = await api.get<ApiResponse<CustomerPointsLog[]>>(`/customers/${customerId}/points-history`);
    return unwrapApiResponse(response);
  },

  // Analytics endpoints
  async getAnalyticsSummary(): Promise<CustomerAnalyticsSummary> {
    const response = await api.get<ApiResponse<CustomerAnalyticsSummary>>('/customer-analytics/summary');
    return unwrapApiResponse(response);
  },

  async getTopByPurchases(limit = 20): Promise<CustomerRanking[]> {
    const response = await api.get<ApiResponse<CustomerRanking[]>>('/customer-analytics/top-by-purchases', { params: { limit } });
    return unwrapApiResponse(response);
  },

  async getTopByRevenue(limit = 20): Promise<CustomerRanking[]> {
    const response = await api.get<ApiResponse<CustomerRanking[]>>('/customer-analytics/top-by-revenue', { params: { limit } });
    return unwrapApiResponse(response);
  },

  async getAreaDistribution(): Promise<AreaDistribution[]> {
    const response = await api.get<ApiResponse<AreaDistribution[]>>('/customer-analytics/area-distribution');
    return unwrapApiResponse(response);
  },

  async getMonthlyTrend(): Promise<MonthlyCustomerTrend[]> {
    const response = await api.get<ApiResponse<MonthlyCustomerTrend[]>>('/customer-analytics/monthly-trend');
    return unwrapApiResponse(response);
  },

  async getPurchaseFrequency(): Promise<PurchaseFrequency[]> {
    const response = await api.get<ApiResponse<PurchaseFrequency[]>>('/customer-analytics/purchase-frequency');
    return unwrapApiResponse(response);
  },
};

import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerPointsLog,
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
};

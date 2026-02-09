import api, { unwrapApiResponse } from './api';
import type { ApiResponse, ShortCode, CreateShortCodeRequest, UpdateShortCodeRequest } from '../domain/types';

export const shortCodeService = {
  async getShortCodes(type?: string): Promise<ShortCode[]> {
    const response = await api.get<ApiResponse<ShortCode[]>>('/short-codes', {
      params: type ? { type } : undefined,
    });
    return unwrapApiResponse(response);
  },

  async createShortCode(data: CreateShortCodeRequest): Promise<ShortCode> {
    const response = await api.post<ApiResponse<ShortCode>>('/short-codes', data);
    return unwrapApiResponse(response);
  },

  async updateShortCode(id: number, data: UpdateShortCodeRequest): Promise<ShortCode> {
    const response = await api.put<ApiResponse<ShortCode>>(`/short-codes/${id}`, data);
    return unwrapApiResponse(response);
  },

  async deleteShortCode(id: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/short-codes/${id}`);
  },
};

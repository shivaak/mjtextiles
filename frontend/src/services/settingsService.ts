import api from './api';
import type { Settings, ApiResponse } from '../domain/types';

// Helper to safely extract data from API response
const extractData = <T>(response: { data: ApiResponse<T> }): T => {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Request failed');
  }
  if (response.data.data === undefined) {
    throw new Error('No data in response');
  }
  return response.data.data;
};

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const response = await api.get<ApiResponse<Settings>>('/settings');
    return extractData(response);
  },

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const response = await api.put<ApiResponse<Settings>>('/settings', data);
    return extractData(response);
  },
};

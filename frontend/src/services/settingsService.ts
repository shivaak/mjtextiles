import api, { unwrapApiResponse } from './api';
import type { Settings, ApiResponse } from '../domain/types';

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const response = await api.get<ApiResponse<Settings>>('/settings');
    return unwrapApiResponse(response);
  },

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const response = await api.put<ApiResponse<Settings>>('/settings', data);
    return unwrapApiResponse(response);
  },
};

import api from './api';
import type { Settings, ApiResponse } from '../domain/types';

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const response = await api.get<ApiResponse<Settings>>('/settings');
    return response.data.data!;
  },
};

import api, { unwrapApiResponse } from './api';
import type { ApiResponse, UserLookup } from '../domain/types';

export const userService = {
  async getUsersLookup(params?: { role?: string }): Promise<UserLookup[]> {
    const response = await api.get<ApiResponse<UserLookup[]>>('/users/lookup', { params });
    return unwrapApiResponse(response);
  },
};

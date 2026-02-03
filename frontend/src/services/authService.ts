import api from './api';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '../domain/types';

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

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return extractData(response);
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return extractData(response);
  },

  async logout(refreshToken: string): Promise<void> {
    const response = await api.post<ApiResponse<void>>('/auth/logout', { refreshToken });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Logout failed');
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.put<ApiResponse<void>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to change password');
    }
  },
};

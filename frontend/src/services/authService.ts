import api, { unwrapApiResponse } from './api';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '../domain/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return unwrapApiResponse(response);
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return unwrapApiResponse(response);
  },

  async logout(refreshToken: string): Promise<void> {
    const response = await api.post<ApiResponse<void>>('/auth/logout', { refreshToken });
    unwrapApiResponse(response, { allowEmptyData: true });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.put<ApiResponse<void>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    unwrapApiResponse(response, { allowEmptyData: true });
  },
};

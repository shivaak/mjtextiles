import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  UserLookup,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
} from '../domain/types';

export const userService = {
  async getUsersLookup(params?: { role?: string }): Promise<UserLookup[]> {
    const response = await api.get<ApiResponse<UserLookup[]>>('/users/lookup', { params });
    return unwrapApiResponse(response);
  },

  async getUsers(params?: { role?: string; isActive?: boolean; search?: string }): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    const users = unwrapApiResponse(response);
    return users.map((user) => ({
      ...user,
      isActive: (user as { isActive?: boolean; active?: boolean }).isActive
        ?? (user as { isActive?: boolean; active?: boolean }).active
        ?? false,
    }));
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return unwrapApiResponse(response);
  },

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return unwrapApiResponse(response);
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    const response = await api.put<ApiResponse<void>>(`/users/${id}/reset-password`, { newPassword } as ResetPasswordRequest);
    return unwrapApiResponse(response, { allowEmptyData: true });
  },
};

import axios, { AxiosError } from 'axios';
import type { ApiResponse } from '../domain/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Custom error class to carry API error details
export class ApiError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const unwrapApiResponse = <T>(
  response: { data: ApiResponse<T> },
  options?: { allowEmptyData?: boolean }
): T => {
  const apiResponse = response.data;
  if (!apiResponse) {
    throw new ApiError('Empty response from server', 'EMPTY_RESPONSE');
  }

  if (apiResponse.success === false) {
    throw new ApiError(
      apiResponse.error?.message || 'Request failed',
      apiResponse.error?.code || 'UNKNOWN_ERROR'
    );
  }

  if (apiResponse.data === undefined) {
    if (options?.allowEmptyData) {
      return undefined as T;
    }
    throw new ApiError('No data in response', 'NO_DATA');
  }

  return apiResponse.data;
};

export const formatApiError = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof ApiError) {
    if (error.message && error.message !== fallbackMessage) {
      return `${fallbackMessage}. ${error.message}`;
    }
    return fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    if (error.message !== fallbackMessage) {
      return `${fallbackMessage}. ${error.message}`;
    }
    return fallbackMessage;
  }

  return fallbackMessage;
};

// Helper to extract error message from API response
const extractErrorMessage = (error: AxiosError<ApiResponse<unknown>>): ApiError => {
  const response = error.response;
  
  if (response?.data) {
    const apiResponse = response.data;
    if (!apiResponse.success && apiResponse.error) {
      return new ApiError(
        apiResponse.error.message || 'An error occurred',
        apiResponse.error.code || 'UNKNOWN_ERROR',
        response.status
      );
    }
  }

  // Fallback for network errors or non-API errors
  if (error.code === 'ECONNABORTED') {
    return new ApiError('Request timed out. Please try again.', 'TIMEOUT');
  }
  
  if (!error.response) {
    return new ApiError('Unable to connect to server. Please check your connection.', 'NETWORK_ERROR');
  }

  return new ApiError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    error.response?.status
  );
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Check if the response indicates a failure (success: false)
    const data = response.data as ApiResponse<unknown>;
    if (data && data.success === false && data.error) {
      throw new ApiError(
        data.error.message || 'An error occurred',
        data.error.code || 'UNKNOWN_ERROR',
        response.status
      );
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as any;

    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(extractErrorMessage(refreshError as AxiosError<ApiResponse<unknown>>));
      }
    }

    // Extract and throw a proper ApiError
    return Promise.reject(extractErrorMessage(error));
  }
);

export default api;

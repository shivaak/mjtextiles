import api, { unwrapApiResponse } from './api';
import type {
  ActivateLicenseRequest,
  ApiResponse,
  LicenseInstallationInfo,
  LicenseStatusInfo,
} from '../domain/types';

export const licenseService = {
  async getStatus(): Promise<LicenseStatusInfo> {
    const response = await api.get<ApiResponse<LicenseStatusInfo>>('/license/status');
    return unwrapApiResponse(response);
  },

  async getInstallationInfo(): Promise<LicenseInstallationInfo> {
    const response = await api.get<ApiResponse<LicenseInstallationInfo>>('/license/installation-id');
    return unwrapApiResponse(response);
  },

  async activate(payload: ActivateLicenseRequest): Promise<LicenseStatusInfo> {
    const response = await api.post<ApiResponse<LicenseStatusInfo>>('/license/activate', payload);
    return unwrapApiResponse(response);
  },

  async remove(): Promise<LicenseStatusInfo> {
    const response = await api.delete<ApiResponse<LicenseStatusInfo>>('/license');
    return unwrapApiResponse(response);
  },
};


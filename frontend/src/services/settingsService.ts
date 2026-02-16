import api, { unwrapApiResponse } from './api';
import type { Settings, UpdateSettingsRequest, ApiResponse, PublicBranding } from '../domain/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const normalizeLogoUrl = (logoUrl?: string): string | undefined => {
  if (!logoUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(logoUrl)) {
    return logoUrl;
  }

  const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
  const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  return `${apiOrigin}${path}`;
};

const normalizeSettings = (settings: Settings): Settings => ({
  ...settings,
  logoUrl: normalizeLogoUrl(settings.logoUrl),
});

const normalizePublicBranding = (branding: PublicBranding): PublicBranding => ({
  ...branding,
  logoUrl: normalizeLogoUrl(branding.logoUrl),
});

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const response = await api.get<ApiResponse<Settings>>('/settings');
    return normalizeSettings(unwrapApiResponse(response));
  },

  async updateSettings(data: UpdateSettingsRequest): Promise<Settings> {
    const response = await api.put<ApiResponse<Settings>>('/settings', data);
    return normalizeSettings(unwrapApiResponse(response));
  },

  async uploadLogo(file: File): Promise<Settings> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<Settings>>('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return normalizeSettings(unwrapApiResponse(response));
  },

  async deleteLogo(): Promise<Settings> {
    const response = await api.delete<ApiResponse<Settings>>('/settings/logo');
    return normalizeSettings(unwrapApiResponse(response));
  },

  async getPublicBranding(): Promise<PublicBranding> {
    const response = await api.get<ApiResponse<PublicBranding>>('/settings/public-branding');
    return normalizePublicBranding(unwrapApiResponse(response));
  },
};

import api, { unwrapApiResponse } from './api';
import type { ApiResponse, LookupDataResponse } from '../domain/types';

export const lookupService = {
  async getLookups(): Promise<LookupDataResponse> {
    const response = await api.get<ApiResponse<LookupDataResponse>>('/lookups');
    return unwrapApiResponse(response);
  },
};

import api, { unwrapApiResponse } from './api';
import type {
  ApiResponse,
  Offer,
  CreateOfferRequest,
  UpdateOfferRequest,
} from '../domain/types';

export const offerService = {
  async getOffers(): Promise<Offer[]> {
    const response = await api.get<ApiResponse<Offer[]>>('/offers');
    return unwrapApiResponse(response);
  },

  async getOfferById(id: number): Promise<Offer> {
    const response = await api.get<ApiResponse<Offer>>(`/offers/${id}`);
    return unwrapApiResponse(response);
  },

  async getActiveOffers(): Promise<Offer[]> {
    const response = await api.get<ApiResponse<Offer[]>>('/offers/active');
    return unwrapApiResponse(response);
  },

  async createOffer(data: CreateOfferRequest): Promise<Offer> {
    const response = await api.post<ApiResponse<Offer>>('/offers', data);
    return unwrapApiResponse(response);
  },

  async updateOffer(id: number, data: UpdateOfferRequest): Promise<Offer> {
    const response = await api.put<ApiResponse<Offer>>(`/offers/${id}`, data);
    return unwrapApiResponse(response);
  },

  async toggleOfferStatus(id: number): Promise<Offer> {
    const response = await api.patch<ApiResponse<Offer>>(`/offers/${id}/toggle`);
    return unwrapApiResponse(response);
  },

  async deleteOffer(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/offers/${id}`);
    unwrapApiResponse(response, { allowEmptyData: true });
  },
};

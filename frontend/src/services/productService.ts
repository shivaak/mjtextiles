import api, { unwrapApiResponse } from './api';
import type {
  Product,
  Variant,
  CreateProductRequest,
  UpdateProductRequest,
  CreateVariantRequest,
  UpdateVariantRequest,
  VariantStatus,
  PagedResponse,
  ApiResponse,
} from '../domain/types';

// Product API calls
export const productService = {
  // Products
  async getProducts(params?: {
    category?: string;
    brand?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<Product>> {
    const response = await api.get<ApiResponse<PagedResponse<Product>>>('/products', { params });
    return unwrapApiResponse(response);
  },

  async getProductById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return unwrapApiResponse(response);
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return unwrapApiResponse(response);
  },

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return unwrapApiResponse(response);
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/categories');
    return unwrapApiResponse(response);
  },

  async getBrands(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/brands');
    return unwrapApiResponse(response);
  },

  // Variants
  async getVariants(params?: {
    productId?: number;
    category?: string;
    brand?: string;
    status?: VariantStatus;
    lowStock?: boolean;
    outOfStock?: boolean;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<Variant>> {
    const response = await api.get<ApiResponse<PagedResponse<Variant>>>('/variants', { params });
    return unwrapApiResponse(response);
  },

  async getVariantById(id: number): Promise<Variant> {
    const response = await api.get<ApiResponse<Variant>>(`/variants/${id}`);
    return unwrapApiResponse(response);
  },

  async createVariant(data: CreateVariantRequest): Promise<Variant> {
    const response = await api.post<ApiResponse<Variant>>('/variants', data);
    return unwrapApiResponse(response);
  },

  async updateVariant(id: number, data: UpdateVariantRequest): Promise<Variant> {
    const response = await api.put<ApiResponse<Variant>>(`/variants/${id}`, data);
    return unwrapApiResponse(response);
  },

  async updateVariantStatus(id: number, status: VariantStatus): Promise<void> {
    const response = await api.put<ApiResponse<void>>(`/variants/${id}/status`, { status });
    unwrapApiResponse(response, { allowEmptyData: true });
  },
};

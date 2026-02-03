import api from './api';
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
    return extractData(response);
  },

  async getProductById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return extractData(response);
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return extractData(response);
  },

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return extractData(response);
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/categories');
    return extractData(response);
  },

  async getBrands(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/brands');
    return extractData(response);
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
    return extractData(response);
  },

  async getVariantById(id: number): Promise<Variant> {
    const response = await api.get<ApiResponse<Variant>>(`/variants/${id}`);
    return extractData(response);
  },

  async createVariant(data: CreateVariantRequest): Promise<Variant> {
    const response = await api.post<ApiResponse<Variant>>('/variants', data);
    return extractData(response);
  },

  async updateVariant(id: number, data: UpdateVariantRequest): Promise<Variant> {
    const response = await api.put<ApiResponse<Variant>>(`/variants/${id}`, data);
    return extractData(response);
  },

  async updateVariantStatus(id: number, status: VariantStatus): Promise<void> {
    const response = await api.put<ApiResponse<void>>(`/variants/${id}/status`, { status });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to update status');
    }
  },
};

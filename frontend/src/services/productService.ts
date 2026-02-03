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
    return response.data.data!;
  },

  async getProductById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data!;
  },

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data!;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/categories');
    return response.data.data!;
  },

  async getBrands(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/brands');
    return response.data.data!;
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
    return response.data.data!;
  },

  async getVariantById(id: number): Promise<Variant> {
    const response = await api.get<ApiResponse<Variant>>(`/variants/${id}`);
    return response.data.data!;
  },

  async createVariant(data: CreateVariantRequest): Promise<Variant> {
    const response = await api.post<ApiResponse<Variant>>('/variants', data);
    return response.data.data!;
  },

  async updateVariant(id: number, data: UpdateVariantRequest): Promise<Variant> {
    const response = await api.put<ApiResponse<Variant>>(`/variants/${id}`, data);
    return response.data.data!;
  },

  async updateVariantStatus(id: number, status: VariantStatus): Promise<void> {
    await api.put(`/variants/${id}/status`, { status });
  },
};

import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  CatalogResponse,
  Paginated,
  Product,
  ProductInput,
} from './models';

export interface ProductQuery {
  search?: string;
  category?: string;
  brand?: string;
  model?: string;
  active?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface CatalogQuery {
  search?: string;
  brand?: string;
  model?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly api = inject(ApiService);

  list(query: ProductQuery = {}) {
    return this.api.get<Paginated<Product>>('/products', {
      search: query.search,
      category: query.category,
      brand: query.brand,
      model: query.model,
      active: query.active,
      lowStock: query.lowStock,
      page: query.page,
      limit: query.limit,
    });
  }

  publicList(query: CatalogQuery = {}) {
    return this.api.get<CatalogResponse>('/products/public', {
      search: query.search,
      brand: query.brand,
      model: query.model,
      category: query.category,
    });
  }

  get(id: string) {
    return this.api.get<{ product: Product }>(`/products/${id}`);
  }

  create(input: ProductInput) {
    return this.api.post<{ product: Product }>('/products', input);
  }

  update(id: string, input: Partial<ProductInput>) {
    return this.api.put<{ product: Product }>(`/products/${id}`, input);
  }

  remove(id: string) {
    return this.api.delete<{ message: string }>(`/products/${id}`);
  }
}

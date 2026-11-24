import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Paginated, Product, ProductInput } from './models';

export interface ProductQuery {
  search?: string;
  category?: string;
  active?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly api = inject(ApiService);

  list(query: ProductQuery = {}) {
    return this.api.get<Paginated<Product>>('/products', {
      search: query.search,
      category: query.category,
      active: query.active,
      lowStock: query.lowStock,
      page: query.page,
      limit: query.limit,
    });
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

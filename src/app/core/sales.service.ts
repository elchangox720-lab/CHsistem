import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Paginated, Sale, SaleInput, SaleStatus } from './models';

export interface SaleQuery {
  search?: string;
  status?: SaleStatus;
  client?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly api = inject(ApiService);

  list(query: SaleQuery = {}) {
    return this.api.get<Paginated<Sale>>('/sales', {
      search: query.search,
      status: query.status,
      client: query.client,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: query.limit,
    });
  }

  get(id: string) {
    return this.api.get<{ sale: Sale }>(`/sales/${id}`);
  }

  create(input: SaleInput) {
    return this.api.post<{ sale: Sale }>('/sales', input);
  }

  pay(id: string) {
    return this.api.patch<{ sale: Sale }>(`/sales/${id}/pay`);
  }

  cancel(id: string) {
    return this.api.patch<{ sale: Sale }>(`/sales/${id}/cancel`);
  }
}

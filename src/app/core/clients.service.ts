import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Client, ClientInput, Paginated } from './models';

export interface ClientQuery {
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly api = inject(ApiService);

  list(query: ClientQuery = {}) {
    return this.api.get<Paginated<Client>>('/clients', {
      search: query.search,
      active: query.active,
      page: query.page,
      limit: query.limit,
    });
  }

  create(input: ClientInput) {
    return this.api.post<{ client: Client }>('/clients', input);
  }

  update(id: string, input: Partial<ClientInput>) {
    return this.api.put<{ client: Client }>(`/clients/${id}`, input);
  }

  remove(id: string) {
    return this.api.delete<{ message: string }>(`/clients/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Paginated, Role, User, UserInput } from './models';

export interface UserQuery {
  search?: string;
  role?: Role;
  active?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);

  list(query: UserQuery = {}) {
    return this.api.get<Paginated<User>>('/users', {
      search: query.search,
      role: query.role,
      active: query.active,
      page: query.page,
      limit: query.limit,
    });
  }

  create(input: UserInput) {
    return this.api.post<{ user: User }>('/users', input);
  }

  update(id: string, input: Partial<UserInput>) {
    return this.api.put<{ user: User }>(`/users/${id}`, input);
  }

  remove(id: string) {
    return this.api.delete<{ message: string }>(`/users/${id}`);
  }
}

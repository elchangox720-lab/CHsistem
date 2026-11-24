import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  MovementType,
  Paginated,
  Product,
  StockMovement,
} from './models';

export interface MovementQuery {
  product?: string;
  type?: MovementType;
  page?: number;
  limit?: number;
}

export interface AdjustInput {
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly api = inject(ApiService);

  movements(query: MovementQuery = {}) {
    return this.api.get<Paginated<StockMovement>>('/inventory/movements', {
      product: query.product,
      type: query.type,
      page: query.page,
      limit: query.limit,
    });
  }

  adjust(input: AdjustInput) {
    return this.api.post<{ movement: StockMovement; product: Product }>(
      '/inventory/adjust',
      input
    );
  }
}

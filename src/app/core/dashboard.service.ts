import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { DashboardSummary } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  summary() {
    return this.api.get<DashboardSummary>('/dashboard/summary');
  }
}

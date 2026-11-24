import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { DashboardService } from '../../core/dashboard.service';
import { apiErrorMessage } from '../../core/error';
import { DashboardSummary, Sale } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { DateEsPipe } from '../../shared/date-es.pipe';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MoneyPipe, DateEsPipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly toast = inject(ToastService);

  protected readonly auth = inject(AuthService);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);

    this.dashboard
      .summary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected clientName(sale: Sale): string {
    return typeof sale.client === 'string'
      ? '—'
      : sale.client?.name ?? '—';
  }

  protected statusClass(status: Sale['status']): string {
    if (status === 'pagada') return 'badge badge--success';
    if (status === 'pendiente') return 'badge badge--warning';
    return 'badge badge--danger';
  }
}

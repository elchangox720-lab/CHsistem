import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error';
import { Sale, SaleStatus } from '../../core/models';
import { SalesService } from '../../core/sales.service';
import { ToastService } from '../../core/toast.service';
import { DateEsPipe } from '../../shared/date-es.pipe';
import { MoneyPipe } from '../../shared/money.pipe';
import { ModalComponent } from '../../shared/modal';

@Component({
  selector: 'app-sales',
  imports: [RouterLink, ModalComponent, MoneyPipe, DateEsPipe],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales implements OnInit {
  private readonly service = inject(SalesService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly items = signal<Sale[]>([]);
  protected readonly selected = signal<Sale | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly loading = signal(true);
  protected readonly statusFilter = signal<'all' | SaleStatus>('all');
  protected readonly search = signal('');
  protected readonly canSell = computed(() =>
    this.auth.hasRole('admin', 'vendedor')
  );
  protected readonly isAdmin = this.auth.isAdmin;

  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    const filter = this.statusFilter();
    const status = filter === 'all' ? undefined : filter;

    this.service
      .list({
        search: this.search() || undefined,
        status,
        page: this.page(),
        limit: 20,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.page > response.pages) {
            this.page.set(response.pages);
            this.load();
            return;
          }

          this.items.set(response.items);
          this.total.set(response.total);
          this.pages.set(response.pages);
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    window.clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 300);
  }

  protected onStatusChange(event: Event): void {
    this.statusFilter.set(
      (event.target as HTMLSelectElement).value as 'all' | SaleStatus
    );
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  protected openDetail(sale: Sale): void {
    this.selected.set(sale);
  }

  protected closeDetail(): void {
    this.selected.set(null);
  }

  protected pay(sale: Sale): void {
    if (!this.canSell() || sale.status !== 'pendiente') return;

    if (!window.confirm(`¿Marcar ${sale.invoiceNumber} como pagada?`)) return;

    this.service.pay(sale._id).subscribe({
      next: (response) => {
        this.replaceSale(response.sale);
        this.toast.show('Venta marcada como pagada');
        this.load();
      },
      error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
    });
  }

  protected cancel(sale: Sale): void {
    if (!this.isAdmin() || sale.status === 'anulada') return;

    if (
      !window.confirm(
        `¿Anular ${sale.invoiceNumber}? El stock será restaurado.`
      )
    ) {
      return;
    }

    this.service.cancel(sale._id).subscribe({
      next: (response) => {
        this.replaceSale(response.sale);
        this.toast.show('Venta anulada y stock restaurado');
        this.load();
      },
      error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
    });
  }

  protected clientName(sale: Sale): string {
    return typeof sale.client === 'string'
      ? '—'
      : sale.client?.name ?? '—';
  }

  protected userName(sale: Sale): string {
    return typeof sale.user === 'string'
      ? '—'
      : sale.user?.name ?? '—';
  }

  protected statusClass(status: SaleStatus): string {
    if (status === 'pagada') return 'badge badge--success';
    if (status === 'pendiente') return 'badge badge--warning';
    return 'badge badge--danger';
  }

  private replaceSale(updated: Sale): void {
    this.items.update((items) =>
      items.map((item) => (item._id === updated._id ? updated : item))
    );

    if (this.selected()?._id === updated._id) {
      this.selected.set(updated);
    }
  }
}

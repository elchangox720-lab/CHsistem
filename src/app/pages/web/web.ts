import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { apiErrorMessage } from '../../core/error';
import { Product } from '../../core/models';
import { ProductsService } from '../../core/products.service';
import { ToastService } from '../../core/toast.service';
import { MoneyPipe } from '../../shared/money.pipe';

type StatusFilter = 'all' | 'published' | 'hidden';

@Component({
  selector: 'app-web',
  imports: [RouterLink, MoneyPipe],
  templateUrl: './web.html',
  styleUrl: './web.css',
})
export class Web implements OnInit {
  private readonly service = inject(ProductsService);
  private readonly toast = inject(ToastService);

  protected readonly items = signal<Product[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly loading = signal(true);
  protected readonly savingId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly stats = signal({ total: 0, published: 0, hidden: 0 });

  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  protected load(): void {
    this.loading.set(true);
    const active =
      this.statusFilter() === 'all'
        ? undefined
        : this.statusFilter() === 'published';

    this.service
      .list({
        search: this.search() || undefined,
        active,
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

  private loadStats(): void {
    forkJoin({
      all: this.service.list({ page: 1, limit: 1 }),
      published: this.service.list({ active: true, page: 1, limit: 1 }),
      hidden: this.service.list({ active: false, page: 1, limit: 1 }),
    }).subscribe({
      next: (response) => {
        this.stats.set({
          total: response.all.total,
          published: response.published.total,
          hidden: response.hidden.total,
        });
      },
      error: () => undefined,
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
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  protected toggle(product: Product): void {
    if (this.savingId()) return;

    const active = !product.active;
    this.savingId.set(product._id);

    this.service
      .update(product._id, { active })
      .pipe(finalize(() => this.savingId.set(null)))
      .subscribe({
        next: () => {
          this.toast.show(
            active
              ? 'Producto publicado en el catálogo'
              : 'Producto oculto del catálogo'
          );
          this.load();
          this.loadStats();
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected isIncomplete(product: Product): boolean {
    return (
      !product.brand?.trim() ||
      !product.model?.trim() ||
      !(product.specs?.length ?? 0)
    );
  }
}

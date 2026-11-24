import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error';
import { Product } from '../../core/models';
import { ProductsService } from '../../core/products.service';
import { ToastService } from '../../core/toast.service';
import { ModalComponent } from '../../shared/modal';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, ModalComponent, MoneyPipe],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private readonly service = inject(ProductsService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<Product[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly search = signal('');
  protected readonly activeFilter = signal<'all' | 'true' | 'false'>('all');
  protected readonly lowStock = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editing = signal<Product | null>(null);
  protected readonly canManage = computed(() =>
    this.auth.hasRole('admin', 'inventario')
  );
  protected readonly isAdmin = this.auth.isAdmin;

  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly form = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: [''],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    cost: [0, [Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    minStock: [0, [Validators.min(0)]],
    active: [true],
  });

  ngOnInit(): void {
    this.load();

    if (this.canManage() && this.route.snapshot.queryParamMap.get('nuevo')) {
      this.openCreate();
    }
  }

  protected load(): void {
    this.loading.set(true);
    const active =
      this.activeFilter() === 'all'
        ? undefined
        : this.activeFilter() === 'true';

    this.service
      .list({
        search: this.search() || undefined,
        active,
        lowStock: this.lowStock() || undefined,
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

  protected onActiveChange(event: Event): void {
    this.activeFilter.set(
      (event.target as HTMLSelectElement).value as 'all' | 'true' | 'false'
    );
    this.page.set(1);
    this.load();
  }

  protected onLowStockChange(event: Event): void {
    this.lowStock.set((event.target as HTMLInputElement).checked);
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  protected openCreate(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.form.reset({
      sku: '',
      name: '',
      category: '',
      description: '',
      price: 0,
      cost: 0,
      stock: 0,
      minStock: 0,
      active: true,
    });
    this.showForm.set(true);
  }

  protected openEdit(product: Product): void {
    if (!this.canManage()) return;
    this.editing.set(product);
    this.form.reset({
      sku: product.sku,
      name: product.name,
      category: product.category ?? '',
      description: product.description ?? '',
      price: product.price,
      cost: product.cost ?? 0,
      stock: product.stock,
      minStock: product.minStock,
      active: product.active,
    });
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;

    const payload = this.form.getRawValue();
    const editing = this.editing();
    this.saving.set(true);

    const request = editing
      ? this.service.update(editing._id, payload)
      : this.service.create(payload);

    request
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.show(editing ? 'Producto actualizado' : 'Producto creado');
          this.showForm.set(false);
          this.load();
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected remove(product: Product): void {
    if (!this.isAdmin()) return;

    if (!window.confirm(`¿Eliminar ${product.name}?`)) return;

    this.service.remove(product._id).subscribe({
      next: () => {
        this.toast.show('Producto eliminado');
        this.load();
      },
      error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
    });
  }

  protected isLow(product: Product): boolean {
    return product.stock <= product.minStock;
  }
}

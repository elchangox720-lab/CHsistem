import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error';
import { InventoryService } from '../../core/inventory.service';
import {
  MovementType,
  Product,
  StockMovement,
} from '../../core/models';
import { ProductsService } from '../../core/products.service';
import { ToastService } from '../../core/toast.service';
import { DateEsPipe } from '../../shared/date-es.pipe';

@Component({
  selector: 'app-inventory',
  imports: [ReactiveFormsModule, RouterLink, DateEsPipe],
  templateUrl: './inventory.html',
})
export class Inventory implements OnInit {
  private readonly inventory = inject(InventoryService);
  private readonly productsService = inject(ProductsService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly movements = signal<StockMovement[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly typeFilter = signal<'all' | MovementType>('all');
  protected readonly productFilter = signal('');
  protected readonly canManage = computed(() =>
    this.auth.hasRole('admin', 'inventario')
  );
  protected readonly lowStockProducts = computed(() =>
    this.products()
      .filter((product) => product.stock <= product.minStock)
      .slice(0, 5)
  );

  protected readonly form = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    type: ['entrada', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0)]],
    reason: [''],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadMovements();
  }

  protected get selectedProduct(): Product | null {
    const id = this.form.controls.productId.value;
    return this.products().find((product) => product._id === id) ?? null;
  }

  protected get selectedType(): string {
    return this.form.controls.type.value;
  }

  protected get quantityLabel(): string {
    return this.selectedType === 'ajuste' ? 'Nuevo stock' : 'Cantidad';
  }

  protected loadProducts(): void {
    this.productsService.list({ limit: 100 }).subscribe({
      next: (response) => this.products.set(response.items),
      error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
    });
  }

  protected loadMovements(): void {
    this.loading.set(true);
    const filter = this.typeFilter();
    const type = filter === 'all' ? undefined : filter;

    this.inventory
      .movements({
        product: this.productFilter() || undefined,
        type,
        page: this.page(),
        limit: 20,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.page > response.pages) {
            this.page.set(response.pages);
            this.loadMovements();
            return;
          }

          this.movements.set(response.items);
          this.total.set(response.total);
          this.pages.set(response.pages);
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected onTypeFilter(event: Event): void {
    this.typeFilter.set(
      (event.target as HTMLSelectElement).value as 'all' | MovementType
    );
    this.page.set(1);
    this.loadMovements();
  }

  protected onProductFilter(event: Event): void {
    this.productFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadMovements();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.loadMovements();
  }

  protected adjust(): void {
    if (this.form.invalid || this.saving()) return;

    const value = this.form.getRawValue();
    const quantity = Number(value.quantity);

    if (value.type !== 'ajuste' && quantity <= 0) {
      this.toast.show('La cantidad debe ser mayor que cero', 'error');
      return;
    }

    this.saving.set(true);

    this.inventory
      .adjust({
        productId: value.productId,
        type: value.type as MovementType,
        quantity,
        reason: value.reason,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.toast.show(
            `Stock de ${response.product.name} actualizado a ${response.product.stock}`
          );
          this.form.patchValue({ quantity: 1, reason: '' });
          this.loadProducts();
          this.loadMovements();
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected typeClass(type: MovementType): string {
    if (type === 'entrada') return 'badge badge--success';
    if (type === 'salida') return 'badge badge--danger';
    return 'badge badge--info';
  }

  protected typeLabel(type: MovementType): string {
    if (type === 'entrada') return 'Entrada';
    if (type === 'salida') return 'Salida';
    return 'Ajuste';
  }

  protected movementDelta(movement: StockMovement): string {
    if (movement.type === 'entrada') return `+${movement.quantity}`;
    if (movement.type === 'salida') return `-${movement.quantity}`;
    return String(movement.quantity);
  }

  protected productName(movement: StockMovement): string {
    return typeof movement.product === 'string'
      ? '—'
      : movement.product?.name ?? '—';
  }

  protected userName(movement: StockMovement): string {
    return typeof movement.user === 'string'
      ? '—'
      : movement.user?.name ?? '—';
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ClientsService } from '../../core/clients.service';
import { apiErrorMessage } from '../../core/error';
import { Client, Product } from '../../core/models';
import { ProductsService } from '../../core/products.service';
import { SalesService } from '../../core/sales.service';
import { ToastService } from '../../core/toast.service';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-sale-new',
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe],
  templateUrl: './sale-new.html',
  styleUrl: './sale-new.css',
})
export class SaleNew implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly productsService = inject(ProductsService);
  private readonly salesService = inject(SalesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly clients = signal<Client[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    clientId: ['', Validators.required],
    taxRate: [0, [Validators.min(0), Validators.max(100)]],
    status: ['pagada' as 'pagada' | 'pendiente', Validators.required],
    notes: [''],
    items: this.fb.array([this.createItem()]),
  });

  ngOnInit(): void {
    forkJoin({
      clients: this.clientsService.list({ active: true, limit: 100 }),
      products: this.productsService.list({ active: true, limit: 100 }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.clients.set(response.clients.items);
          this.products.set(response.products.items);
        },
        error: (error) => this.error.set(apiErrorMessage(error)),
      });
  }

  protected get items(): FormArray {
    return this.form.controls.items;
  }

  protected get subtotal(): number {
    return this.items.controls.reduce((sum, control) => {
      const quantity = Number(control.get('quantity')?.value) || 0;
      const unitPrice = Number(control.get('unitPrice')?.value) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  }

  protected get tax(): number {
    return (this.subtotal * (Number(this.form.controls.taxRate.value) || 0)) / 100;
  }

  protected get total(): number {
    return this.subtotal + this.tax;
  }

  protected addItem(): void {
    this.items.push(this.createItem());
  }

  protected removeItem(index: number): void {
    if (this.items.length <= 1) return;
    this.items.removeAt(index);
  }

  protected onProductChange(index: number): void {
    const control = this.items.at(index);
    const productId = control?.get('productId')?.value as string | undefined;
    const product = this.products().find((item) => item._id === productId);

    if (product) {
      control?.get('unitPrice')?.setValue(product.price);
    }
  }

  protected lineSubtotal(index: number): number {
    const control = this.items.at(index);
    const quantity = Number(control?.get('quantity')?.value) || 0;
    const unitPrice = Number(control?.get('unitPrice')?.value) || 0;
    return quantity * unitPrice;
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.toast.show('Completa el cliente y los productos', 'error');
      return;
    }

    const raw = this.form.getRawValue();
    const prepared: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }> = [];
    const seen = new Set<string>();

    for (const item of raw.items) {
      if (!item.productId) {
        this.toast.show('Selecciona un producto en cada línea', 'error');
        return;
      }

      if (seen.has(item.productId)) {
        this.toast.show('No repitas el mismo producto en la venta', 'error');
        return;
      }

      seen.add(item.productId);

      const product = this.products().find(
        (candidate) => candidate._id === item.productId
      );

      if (!product) {
        this.toast.show('Uno de los productos ya no está disponible', 'error');
        return;
      }

      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity < 1) {
        this.toast.show('La cantidad debe ser mayor que cero', 'error');
        return;
      }

      if (quantity > product.stock) {
        this.toast.show(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
          'error'
        );
        return;
      }

      prepared.push({
        productId: item.productId,
        quantity,
        unitPrice: Number(item.unitPrice) || 0,
      });
    }

    if (prepared.length === 0) {
      this.toast.show('Agrega al menos un producto', 'error');
      return;
    }

    this.saving.set(true);

    this.salesService
      .create({
        clientId: raw.clientId,
        items: prepared,
        taxRate: Number(raw.taxRate) || 0,
        status: raw.status,
        notes: raw.notes,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.toast.show(`Venta ${response.sale.invoiceNumber} registrada`);
          void this.router.navigate(['/ventas']);
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  private createItem() {
    return this.fb.nonNullable.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });
  }
}

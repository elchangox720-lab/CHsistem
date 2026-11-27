import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { apiErrorMessage } from '../../../core/error';
import { PublicProduct, ProductSpec } from '../../../core/models';
import { ProductsService } from '../../../core/products.service';
import { SITE } from '../../../core/site';
import { ModalComponent } from '../../../shared/modal';
import { MoneyPipe } from '../../../shared/money.pipe';

@Component({
  selector: 'app-catalog',
  imports: [ModalComponent, MoneyPipe],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
  private readonly productsService = inject(ProductsService);

  protected readonly site = SITE;
  protected readonly items = signal<PublicProduct[]>([]);
  protected readonly brands = signal<string[]>([]);
  protected readonly categories = signal<string[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly brand = signal('');
  protected readonly model = signal('');
  protected readonly category = signal('');
  protected readonly selected = signal<PublicProduct | null>(null);

  protected readonly models = computed(() => {
    const brand = this.brand();
    const values = new Set<string>();

    for (const product of this.items()) {
      if (brand && product.brand !== brand) continue;
      if (product.model) values.add(product.model);
    }

    return [...values].sort((a, b) => a.localeCompare(b, 'es'));
  });

  protected readonly filtered = computed(() => {
    const search = this.search().trim().toLowerCase();
    const brand = this.brand();
    const model = this.model();
    const category = this.category();

    return this.items().filter((product) => {
      if (brand && product.brand !== brand) return false;
      if (model && product.model !== model) return false;
      if (category && product.category !== category) return false;
      if (!search) return true;

      const specs = (product.specs ?? [])
        .map((spec) => `${spec.label} ${spec.value}`)
        .join(' ');

      return [
        product.name,
        product.sku,
        product.brand,
        product.model,
        product.category,
        product.description,
        specs,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  });

  protected readonly hasFilters = computed(() =>
    Boolean(this.search() || this.brand() || this.model() || this.category())
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');

    this.productsService.publicList().subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.brands.set(response.brands);
        this.categories.set(response.categories);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onBrand(event: Event): void {
    const brand = (event.target as HTMLSelectElement).value;
    this.brand.set(brand);

    const models = new Set(
      this.items()
        .filter((product) => !brand || product.brand === brand)
        .map((product) => product.model)
        .filter((model): model is string => Boolean(model))
    );

    if (this.model() && !models.has(this.model())) {
      this.model.set('');
    }
  }

  protected onModel(event: Event): void {
    this.model.set((event.target as HTMLSelectElement).value);
  }

  protected onCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.brand.set('');
    this.model.set('');
    this.category.set('');
  }

  protected open(product: PublicProduct): void {
    this.selected.set(product);
  }

  protected close(): void {
    this.selected.set(null);
  }

  protected previewSpecs(product: PublicProduct): ProductSpec[] {
    return (product.specs ?? []).slice(0, 3);
  }

  protected initial(product: PublicProduct): string {
    return (product.brand || product.name || 'CH').trim().charAt(0).toUpperCase();
  }

  protected waLink(product: PublicProduct): string {
    const details = [
      product.brand,
      product.model,
      product.sku ? `SKU ${product.sku}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    const text = `Hola CHsistems, me interesa ${product.name}${
      details ? ` (${details})` : ''
    }. ¿Está disponible?`;

    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  }
}

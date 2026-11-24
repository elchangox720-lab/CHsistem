import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ClientsService } from '../../core/clients.service';
import { apiErrorMessage } from '../../core/error';
import { Client } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { DateEsPipe } from '../../shared/date-es.pipe';
import { ModalComponent } from '../../shared/modal';

@Component({
  selector: 'app-clients',
  imports: [ReactiveFormsModule, ModalComponent, DateEsPipe],
  templateUrl: './clients.html',
})
export class Clients implements OnInit {
  private readonly service = inject(ClientsService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<Client[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly search = signal('');
  protected readonly activeFilter = signal<'all' | 'true' | 'false'>('all');
  protected readonly showForm = signal(false);
  protected readonly editing = signal<Client | null>(null);
  protected readonly canWrite = computed(() =>
    this.auth.hasRole('admin', 'vendedor')
  );
  protected readonly isAdmin = this.auth.isAdmin;

  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    taxId: [''],
    email: ['', [Validators.email]],
    phone: [''],
    address: [''],
    notes: [''],
    active: [true],
  });

  ngOnInit(): void {
    this.load();

    if (this.canWrite() && this.route.snapshot.queryParamMap.get('nuevo')) {
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

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  protected openCreate(): void {
    if (!this.canWrite()) return;
    this.editing.set(null);
    this.form.reset({
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      active: true,
    });
    this.showForm.set(true);
  }

  protected openEdit(client: Client): void {
    if (!this.canWrite()) return;
    this.editing.set(client);
    this.form.reset({
      name: client.name,
      taxId: client.taxId ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
      active: client.active,
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
          this.toast.show(editing ? 'Cliente actualizado' : 'Cliente creado');
          this.showForm.set(false);
          this.load();
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected remove(client: Client): void {
    if (!this.isAdmin()) return;

    if (!window.confirm(`¿Eliminar a ${client.name}?`)) return;

    this.service.remove(client._id).subscribe({
      next: () => {
        this.toast.show('Cliente eliminado');
        this.load();
      },
      error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
    });
  }

  protected contact(client: Client): string {
    return [client.email, client.phone].filter(Boolean).join(' · ') || '—';
  }
}

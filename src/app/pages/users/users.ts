import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error';
import { Role, User, UserInput } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { UsersService } from '../../core/users.service';
import { DateEsPipe } from '../../shared/date-es.pipe';
import { ModalComponent } from '../../shared/modal';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, ModalComponent, DateEsPipe],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private readonly service = inject(UsersService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly users = signal<User[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly search = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly editing = signal<User | null>(null);
  protected readonly editingSelf = computed(
    () => this.editing()?._id === this.auth.user()?._id
  );
  protected readonly modalTitle = computed(() =>
    this.editing() ? 'Editar usuario' : 'Nuevo usuario'
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['vendedor' as Role, Validators.required],
    password: [''],
    active: [true],
  });

  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);

    this.service
      .list({ search: this.search() || undefined, page: this.page(), limit: 20 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.page > response.pages) {
            this.page.set(response.pages);
            this.load();
            return;
          }

          this.users.set(response.items);
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

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '',
      email: '',
      role: 'vendedor',
      password: '',
      active: true,
    });
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(6),
    ]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  protected openEdit(user: User): void {
    this.editing.set(user);
    this.form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      active: user.active,
    });
    this.form.controls.password.setValidators([Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
    this.editing.set(null);
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) {
      this.toast.show('Revisa los datos del usuario', 'error');
      return;
    }

    const value = this.form.getRawValue();
    const password = value.password.trim();

    if (!this.editing() && password.length < 6) {
      this.toast.show('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (this.editing() && password && password.length < 6) {
      this.toast.show('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    const payload: Partial<UserInput> = {
      name: value.name,
      email: value.email,
      role: value.role,
      active: value.active,
    };

    if (password) {
      payload.password = password;
    }

    this.saving.set(true);
    const editing = this.editing();
    const request = editing
      ? this.service.update(editing._id, payload)
      : this.service.create({ ...payload, active: true } as UserInput);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.show(editing ? 'Usuario actualizado' : 'Usuario creado');
        this.closeModal();
        this.load();
      },
      error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
    });
  }

  protected remove(user: User): void {
    if (user._id === this.auth.user()?._id) {
      this.toast.show('No puedes eliminar tu propio usuario', 'error');
      return;
    }

    if (
      !window.confirm(
        `¿Eliminar permanentemente a ${user.name}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    this.service.remove(user._id).subscribe({
      next: () => {
        this.toast.show('Usuario eliminado');
        this.load();
      },
      error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
    });
  }

  protected isSelf(user: User): boolean {
    return user._id === this.auth.user()?._id;
  }

  protected roleLabel(role: Role): string {
    if (role === 'admin') return 'Administrador';
    if (role === 'vendedor') return 'Vendedor';
    return 'Inventario';
  }
}

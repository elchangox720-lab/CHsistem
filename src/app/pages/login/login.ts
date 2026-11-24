import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly needsSetup = signal(false);
  protected readonly checking = signal(true);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly setupForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.api
      .get<{ needsSetup: boolean }>('/auth/setup-status')
      .pipe(finalize(() => this.checking.set(false)))
      .subscribe({
        next: (response) => this.needsSetup.set(response.needsSetup),
        error: () =>
          this.error.set(
            'No se pudo conectar con el servidor. Verifica que la API esté disponible.'
          ),
      });
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.loginForm.getRawValue();

    this.auth
      .login(email, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Bienvenido a CHsistem');
          this.goHome();
        },
        error: (error) => this.error.set(apiErrorMessage(error)),
      });
  }

  protected submitSetup(): void {
    if (this.setupForm.invalid || this.loading()) {
      return;
    }

    const value = this.setupForm.getRawValue();

    if (value.password !== value.confirm) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth
      .setup({
        name: value.name,
        email: value.email,
        password: value.password,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Administrador creado. ¡Bienvenido!');
          this.goHome();
        },
        error: (error) => this.error.set(apiErrorMessage(error)),
      });
  }

  private goHome(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const target =
      returnUrl && returnUrl.startsWith('/') ? returnUrl : '/';
    void this.router.navigateByUrl(target);
  }
}

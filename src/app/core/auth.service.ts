import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, Role, User } from './models';

const TOKEN_KEY = 'chsistem.token';
const USER_KEY = 'chsistem.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(this.readToken());
  readonly user = signal<User | null>(this.readUser());
  readonly isAuthenticated = computed(() => Boolean(this.token() && this.user()));
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/login', { email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  setup(payload: {
    name: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/setup', payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  me(): Observable<{ user: User }> {
    return this.api
      .get<{ user: User }>('/auth/me')
      .pipe(tap((response) => this.saveUser(response.user)));
  }

  hasRole(...roles: Role[]): boolean {
    const current = this.user();
    return Boolean(current && roles.includes(current.role));
  }

  clearSession(): void {
    this.token.set(null);
    this.user.set(null);

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Almacenamiento no disponible.
    }
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private setSession(response: AuthResponse): void {
    this.token.set(response.token);
    this.user.set(response.user);

    try {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch {
      // Almacenamiento no disponible.
    }
  }

  private saveUser(user: User): void {
    this.user.set(user);

    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Almacenamiento no disponible.
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}

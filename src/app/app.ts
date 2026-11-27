import { Component, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';
import { Role } from './core/models';
import { ToastService } from './core/toast.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);
  protected readonly toasts = this.toastService.toasts;
  protected readonly isPublicPage = signal(
    this.isPublicUrl(window.location.pathname)
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.isPublicPage.set(this.isPublicUrl(this.router.url));
      });
  }

  private isPublicUrl(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    return (
      path === '/login' ||
      path === '/catalogo' ||
      path.startsWith('/catalogo/')
    );
  }

  protected roleLabel(role?: Role): string {
    if (role === 'admin') return 'Administrador';
    if (role === 'vendedor') return 'Vendedor';
    if (role === 'inventario') return 'Inventario';
    return '';
  }

  protected initials(): string {
    const name = this.auth.user()?.name?.trim();

    if (!name) return 'CH';

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected dismissToast(id: number): void {
    this.toastService.dismiss(id);
  }

  protected logout(): void {
    this.auth.logout();
  }
}

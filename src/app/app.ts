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
import { SeoService } from './core/seo.service';
import { SITE } from './core/site';
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
  private readonly seo = inject(SeoService);

  protected readonly auth = inject(AuthService);
  protected readonly toasts = this.toastService.toasts;
  protected readonly isPublicPage = signal(
    this.isPublicUrl(window.location.pathname)
  );

  constructor() {
    this.applyPrivateSeo(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        const url = this.router.url;
        this.isPublicPage.set(this.isPublicUrl(url));
        this.applyPrivateSeo(url);
      });
  }

  private applyPrivateSeo(url: string): void {
    const path = url.split(/[?#]/)[0];

    if (
      path === '/' ||
      path === '/catalogo' ||
      path.startsWith('/catalogo/')
    ) {
      return;
    }

    this.seo.setNoindex(
      path === '/login' ? `Iniciar sesión | ${SITE.name}` : `Panel | ${SITE.name}`
    );
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

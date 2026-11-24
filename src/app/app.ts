import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  protected readonly title = signal('CHsistem');
  protected readonly auth = inject(AuthService);
  protected readonly toasts = this.toastService.toasts;

  protected roleLabel(role?: Role): string {
    if (role === 'admin') return 'Administrador';
    if (role === 'vendedor') return 'Vendedor';
    if (role === 'inventario') return 'Inventario';
    return '';
  }

  protected dismissToast(id: number): void {
    this.toastService.dismiss(id);
  }

  protected logout(): void {
    this.auth.logout();
  }
}

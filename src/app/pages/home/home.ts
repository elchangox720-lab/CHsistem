import { Component, inject, signal } from '@angular/core';
import { ApiService, HealthResponse } from '../../core/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly api = inject(ApiService);

  protected readonly health = signal<HealthResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.checkStatus();
  }

  protected checkStatus(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getHealth().subscribe({
      next: (health) => {
        this.health.set(health);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con la API. Render puede estar iniciando.');
        this.loading.set(false);
      },
    });
  }
}

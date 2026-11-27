import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SITE } from '../../core/site';
import { Catalog } from './catalog/catalog';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, Catalog],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  protected readonly auth = inject(AuthService);
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
  protected readonly whatsappHref = this.waLink(
    'Hola CHsistems, quiero información sobre los equipos del catálogo.'
  );

  protected closeMenu(event: Event): void {
    const target = event.currentTarget as HTMLElement | null;
    target?.closest('details')?.removeAttribute('open');
  }

  private waLink(text: string): string {
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  }
}

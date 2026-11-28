import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SITE } from '../../core/site';
import { SiteContentService } from '../../core/site-content.service';
import { Catalog } from './catalog/catalog';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, Catalog],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  private readonly siteContent = inject(SiteContentService);

  protected readonly auth = inject(AuthService);
  protected readonly site = SITE;
  protected readonly content = this.siteContent.content;
  protected readonly year = new Date().getFullYear();

  ngOnInit(): void {
    this.siteContent.load().subscribe();
  }

  protected get whatsappHref(): string {
    return this.waLink(
      'Hola CHsistems, quiero información sobre los equipos del catálogo.'
    );
  }

  protected closeMenu(event: Event): void {
    const target = event.currentTarget as HTMLElement | null;
    target?.closest('details')?.removeAttribute('open');
  }

  private waLink(text: string): string {
    return `https://wa.me/${this.content().contact.whatsapp}?text=${encodeURIComponent(text)}`;
  }
}

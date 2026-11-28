import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE } from './site';

export interface SeoPage {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  jsonLd?: unknown;
  noindex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setPage(page: SeoPage): void {
    const url = this.absoluteUrl(page.path);
    const image = this.absoluteImage(page.image);

    this.title.setTitle(page.title);
    this.setMeta('name', 'description', page.description);
    this.setMeta(
      'name',
      'robots',
      page.noindex ? 'noindex,nofollow' : 'index,follow'
    );
    this.setMeta('property', 'og:type', page.type ?? 'website');
    this.setMeta('property', 'og:site_name', SITE.name);
    this.setMeta('property', 'og:locale', 'es_CO');
    this.setMeta('property', 'og:title', page.title);
    this.setMeta('property', 'og:description', page.description);
    this.setMeta('property', 'og:url', url);
    this.setMeta('property', 'og:image', image);
    this.setMeta('property', 'og:image:alt', SITE.name);
    this.setMeta('name', 'twitter:card', 'summary_large_image');
    this.setMeta('name', 'twitter:title', page.title);
    this.setMeta('name', 'twitter:description', page.description);
    this.setMeta('name', 'twitter:image', image);
    this.setCanonical(url);
    this.setJsonLd(page.jsonLd);
  }

  setNoindex(title = `${SITE.name} | Acceso`): void {
    const description = 'Acceso privado al panel de CHsistems.';
    const url = this.absoluteUrl(this.document.location.pathname);

    this.title.setTitle(title);
    this.setMeta('name', 'description', description);
    this.setMeta('name', 'robots', 'noindex,nofollow');
    this.setMeta('property', 'og:title', title);
    this.setMeta('property', 'og:description', description);
    this.setMeta('property', 'og:url', url);
    this.setMeta('name', 'twitter:title', title);
    this.setMeta('name', 'twitter:description', description);
    this.setCanonical(url);
    this.setJsonLd(null);
  }

  absoluteUrl(path: string): string {
    return new URL(path, SITE.url).toString();
  }

  absoluteImage(image?: string): string {
    if (!image || image.startsWith('data:')) {
      return `${SITE.url}/brand-logo.jpg`;
    }

    return this.absoluteUrl(image);
  }

  private setMeta(
    attribute: 'name' | 'property',
    key: string,
    content: string
  ): void {
    this.meta.updateTag({ [attribute]: key, content });
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );

    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }

    link.href = url;
  }

  private setJsonLd(data: unknown): void {
    const id = 'chsistem-jsonld';
    this.document.getElementById(id)?.remove();

    if (!data) return;

    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }
}

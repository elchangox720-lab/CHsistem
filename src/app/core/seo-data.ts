import { PublicProduct } from './models';
import { SiteContent } from './site-content';
import { SITE } from './site';

const LOGO_URL = `${SITE.url}/brand-logo.jpg`;

export function landingJsonLd(content: SiteContent): unknown {
  const telephone = `+${content.contact.whatsapp}`;
  const plans = content.planItems.map((plan) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: plan.name,
      description: plan.tagline,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        logo: LOGO_URL,
        image: LOGO_URL,
        email: content.contact.email,
        telephone,
        description: content.hero.description,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: 'es-CO',
        publisher: { '@id': `${SITE.url}/#organization` },
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${SITE.url}/#service`,
        name: SITE.name,
        description: content.hero.description,
        url: SITE.url,
        image: LOGO_URL,
        telephone,
        email: content.contact.email,
        areaServed: { '@type': 'Country', name: 'Colombia' },
        priceRange: '$$',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Planes de diseño web',
          itemListElement: plans,
        },
      },
    ],
  };
}

export function catalogJsonLd(
  content: SiteContent,
  products: PublicProduct[]
): unknown {
  const graph: unknown[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: `${SITE.url}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Catálogo',
          item: `${SITE.url}/catalogo`,
        },
      ],
    },
    {
      '@type': 'CollectionPage',
      '@id': `${SITE.url}/catalogo#page`,
      url: `${SITE.url}/catalogo`,
      name: `${content.catalog.title} ${content.catalog.accent}`.trim(),
      description: content.catalog.description,
      inLanguage: 'es-CO',
      isPartOf: { '@id': `${SITE.url}/#website` },
    },
  ];

  if (products.length > 0) {
    graph.push({
      '@type': 'ItemList',
      name: `${content.catalog.title} ${content.catalog.accent}`.trim(),
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: productJsonLd(product),
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function productJsonLd(product: PublicProduct): unknown {
  const image = absoluteImage(product.image);

  return {
    '@type': 'Product',
    name: product.name,
    description:
      product.description ||
      `${product.name} disponible en el catálogo de CHsistems.`,
    sku: product.sku,
    ...(product.brand
      ? { brand: { '@type': 'Brand', name: product.brand } }
      : {}),
    ...(product.model ? { model: product.model } : {}),
    ...(image ? { image } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE.url}/catalogo`,
      priceCurrency: 'COP',
      price: product.price,
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}

function absoluteImage(image?: string): string | null {
  if (!image || image.startsWith('data:')) {
    return null;
  }

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  return new URL(image, SITE.url).toString();
}

import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SITE } from '../../core/site';
import { ToastService } from '../../core/toast.service';
import { Catalog } from './catalog/catalog';

interface Plan {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  featured: boolean;
}

@Component({
  selector: 'app-landing',
  imports: [ReactiveFormsModule, RouterLink, Catalog],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
  protected readonly whatsappHref = this.waLink(
    'Hola CHsistems, quiero información sobre sus servicios web.'
  );

  protected readonly benefits = [
    {
      title: 'Diseño a medida',
      text: 'Una imagen alineada a tu marca y a lo que quieres comunicar.',
    },
    {
      title: '100% adaptable',
      text: 'Se ve bien en celulares, tablets y pantallas de escritorio.',
    },
    {
      title: 'SEO básico',
      text: 'Bases sólidas para que te encuentren en los buscadores.',
    },
    {
      title: 'Trato directo',
      text: 'Acompañamiento cercano desde la idea hasta la publicación.',
    },
  ];

  protected readonly plans: Plan[] = [
    {
      name: 'Web Emprendedor',
      price: '$350.000',
      tagline: 'Ideal para empezar con una presencia profesional.',
      features: [
        'Página de una sola sección larga',
        'Adaptación a celulares',
        'Botón de WhatsApp',
        'Formulario de contacto',
        'Diseño basado en plantilla',
      ],
      featured: false,
    },
    {
      name: 'Web Empresarial',
      price: '$650.000 – $900.000',
      tagline: 'Para negocios que necesitan mostrar más y vender mejor.',
      features: [
        'Hasta 5 secciones',
        'Inicio, nosotros, servicios y contacto',
        'Galería de imágenes',
        'Diseño adaptable',
        'SEO básico',
      ],
      featured: true,
    },
    {
      name: 'Tienda Virtual',
      price: '$1.200.000 – $1.800.000',
      tagline: 'Tu catálogo y tus ventas en línea, listos para crecer.',
      features: [
        'Catálogo de productos',
        'Carrito de compras',
        'Contacto por WhatsApp',
        'Configuración inicial',
        'Capacitación básica',
      ],
      featured: false,
    },
  ];

  protected readonly steps = [
    {
      title: 'Conversamos',
      text: 'Entendemos tu negocio, tus objetivos y lo que necesitas comunicar.',
    },
    {
      title: 'Propuesta',
      text: 'Definimos alcance, tiempos y precio antes de empezar.',
    },
    {
      title: 'Diseño y desarrollo',
      text: 'Construimos tu sitio y lo revisamos juntos paso a paso.',
    },
    {
      title: 'Publicación',
      text: 'Lanzamos, te capacitamos y quedamos disponibles para acompañarte.',
    },
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    plan: ['Web Emprendedor'],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected planHref(plan: Plan): string {
    return this.waLink(
      `Hola CHsistems, me interesa el plan ${plan.name} (${plan.price}). ¿Podemos conversar?`
    );
  }

  protected closeMenu(event: Event): void {
    const target = event.currentTarget as HTMLElement | null;
    target?.closest('details')?.removeAttribute('open');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, plan, message } = this.form.getRawValue();
    const url = this.waLink(
      `Hola CHsistems, soy ${name}.\nCorreo: ${email}\nPlan de interés: ${plan}\n\n${message}`
    );

    window.open(url, '_blank', 'noopener,noreferrer');
    this.toast.show('Abriendo WhatsApp con tu mensaje...');
    this.form.reset({
      name: '',
      email: '',
      plan: 'Web Emprendedor',
      message: '',
    });
  }

  private waLink(text: string): string {
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  }
}

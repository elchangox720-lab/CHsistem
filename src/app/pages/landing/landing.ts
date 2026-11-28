import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SITE } from '../../core/site';
import { SitePlan } from '../../core/site-content';
import { SiteContentService } from '../../core/site-content.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-landing',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly siteContent = inject(SiteContentService);

  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
  protected readonly content = this.siteContent.content;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    plan: ['Web Emprendedor'],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.siteContent.load().subscribe(() => this.syncSelectedPlan());
  }

  protected get whatsappHref(): string {
    return this.waLink(
      'Hola CHsistems, quiero información sobre sus servicios web.'
    );
  }

  protected planHref(plan: SitePlan): string {
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
      plan: this.content().planItems[0]?.name ?? 'Web Emprendedor',
      message: '',
    });
  }

  private syncSelectedPlan(): void {
    const plans = this.content().planItems;
    const current = this.form.controls.plan.value;

    if (plans.length > 0 && !plans.some((plan) => plan.name === current)) {
      this.form.controls.plan.setValue(plans[0].name);
    }
  }

  private waLink(text: string): string {
    return `https://wa.me/${this.content().contact.whatsapp}?text=${encodeURIComponent(text)}`;
  }
}

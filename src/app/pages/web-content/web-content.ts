import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/error';
import {
  DEFAULT_SITE_CONTENT,
  SiteBenefit,
  SiteContent,
  SitePlan,
  SiteStep,
} from '../../core/site-content';
import { SiteContentService } from '../../core/site-content.service';
import { ToastService } from '../../core/toast.service';

type SectionForm = FormGroup<{
  eyebrow: FormControl<string>;
  title: FormControl<string>;
  accent: FormControl<string>;
  description: FormControl<string>;
}>;

type BenefitForm = FormGroup<{
  title: FormControl<string>;
  text: FormControl<string>;
}>;

type PlanForm = FormGroup<{
  name: FormControl<string>;
  price: FormControl<string>;
  tagline: FormControl<string>;
  features: FormArray<FormControl<string>>;
  featured: FormControl<boolean>;
}>;

type StepForm = FormGroup<{
  title: FormControl<string>;
  text: FormControl<string>;
}>;

@Component({
  selector: 'app-web-content',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './web-content.html',
  styleUrl: './web-content.css',
})
export class WebContent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly siteContent = inject(SiteContentService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    hero: this.fb.nonNullable.group({
      eyebrow: ['', Validators.required],
      title: ['', Validators.required],
      accent: [''],
      description: ['', Validators.required],
      primaryCta: [''],
      secondaryCta: [''],
      points: this.fb.array<FormControl<string>>([]),
    }),
    services: this.sectionGroup(),
    benefits: this.fb.array<BenefitForm>([]),
    catalog: this.fb.nonNullable.group({
      eyebrow: [''],
      title: [''],
      accent: [''],
      description: [''],
      cta: [''],
    }),
    plans: this.sectionGroup(),
    planItems: this.fb.array<PlanForm>([]),
    plansNote: [''],
    process: this.sectionGroup(),
    steps: this.fb.array<StepForm>([]),
    contact: this.fb.nonNullable.group({
      eyebrow: [''],
      title: [''],
      accent: [''],
      description: [''],
      whatsapp: [
        '',
        [Validators.required, Validators.pattern(/^\d{7,15}$/)],
      ],
      whatsappLabel: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    }),
    footer: this.fb.nonNullable.group({
      description: [''],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  protected get points(): FormArray<FormControl<string>> {
    return this.form.controls.hero.controls.points;
  }

  protected get benefits(): FormArray<BenefitForm> {
    return this.form.controls.benefits;
  }

  protected get planItems(): FormArray<PlanForm> {
    return this.form.controls.planItems;
  }

  protected get steps(): FormArray<StepForm> {
    return this.form.controls.steps;
  }

  protected load(): void {
    this.loading.set(true);

    this.siteContent
      .load(true)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (content) => this.fill(content),
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  protected addPoint(): void {
    this.points.push(this.fb.nonNullable.control(''));
  }

  protected removePoint(index: number): void {
    this.points.removeAt(index);
  }

  protected addBenefit(): void {
    this.benefits.push(this.benefitGroup());
  }

  protected removeBenefit(index: number): void {
    this.benefits.removeAt(index);
  }

  protected addPlan(): void {
    this.planItems.push(this.planGroup());
  }

  protected removePlan(index: number): void {
    this.planItems.removeAt(index);
  }

  protected planFeatures(planIndex: number): FormArray<FormControl<string>> {
    return this.planItems.at(planIndex).controls.features;
  }

  protected addFeature(planIndex: number): void {
    this.planFeatures(planIndex).push(this.fb.nonNullable.control(''));
  }

  protected removeFeature(planIndex: number, featureIndex: number): void {
    this.planFeatures(planIndex).removeAt(featureIndex);
  }

  protected addStep(): void {
    this.steps.push(this.stepGroup());
  }

  protected removeStep(index: number): void {
    this.steps.removeAt(index);
  }

  protected resetDefaults(): void {
    if (
      !window.confirm(
        '¿Restaurar los textos originales? Podrás revisarlos antes de guardar.'
      )
    ) {
      return;
    }

    this.fill(DEFAULT_SITE_CONTENT);
    this.toast.show('Textos originales cargados. Guarda para publicarlos.');
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('Revisa los campos marcados antes de guardar.', 'error');
      return;
    }

    this.saving.set(true);

    this.siteContent
      .update(this.form.getRawValue() as SiteContent)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (content) => {
          this.fill(content);
          this.toast.show('Contenido de la landing actualizado');
        },
        error: (error) => this.toast.show(apiErrorMessage(error), 'error'),
      });
  }

  private fill(content: SiteContent): void {
    const { points, ...hero } = content.hero;
    this.form.controls.hero.patchValue(hero);
    this.points.clear();
    points.forEach((point) =>
      this.points.push(this.fb.nonNullable.control(point))
    );

    this.form.controls.services.patchValue(content.services);
    this.benefits.clear();
    content.benefits.forEach((benefit) =>
      this.benefits.push(this.benefitGroup(benefit))
    );

    this.form.controls.catalog.patchValue(content.catalog);
    this.form.controls.plans.patchValue(content.plans);
    this.planItems.clear();
    content.planItems.forEach((plan) =>
      this.planItems.push(this.planGroup(plan))
    );

    this.form.controls.plansNote.setValue(content.plansNote);
    this.form.controls.process.patchValue(content.process);
    this.steps.clear();
    content.steps.forEach((step) => this.steps.push(this.stepGroup(step)));

    this.form.controls.contact.patchValue(content.contact);
    this.form.controls.footer.patchValue(content.footer);
    this.form.markAsPristine();
  }

  private sectionGroup(): SectionForm {
    return this.fb.nonNullable.group({
      eyebrow: [''],
      title: [''],
      accent: [''],
      description: [''],
    });
  }

  private benefitGroup(benefit?: SiteBenefit): BenefitForm {
    return this.fb.nonNullable.group({
      title: [benefit?.title ?? '', Validators.required],
      text: [benefit?.text ?? '', Validators.required],
    });
  }

  private planGroup(plan?: SitePlan): PlanForm {
    return this.fb.nonNullable.group({
      name: [plan?.name ?? '', Validators.required],
      price: [plan?.price ?? '', Validators.required],
      tagline: [plan?.tagline ?? ''],
      features: this.fb.array<FormControl<string>>(
        (plan?.features ?? []).map((feature) =>
          this.fb.nonNullable.control(feature)
        )
      ),
      featured: [plan?.featured ?? false],
    });
  }

  private stepGroup(step?: SiteStep): StepForm {
    return this.fb.nonNullable.group({
      title: [step?.title ?? '', Validators.required],
      text: [step?.text ?? '', Validators.required],
    });
  }
}

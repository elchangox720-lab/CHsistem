import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  transform(value: number | string | null | undefined): string {
    const amount = Number(value);
    return `$${this.formatter.format(Number.isFinite(amount) ? amount : 0)}`;
  }
}

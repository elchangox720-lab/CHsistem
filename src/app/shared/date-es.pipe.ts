import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateEs' })
export class DateEsPipe implements PipeTransform {
  private readonly dateFormatter = new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
  });

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  transform(
    value: string | Date | null | undefined,
    mode: 'date' | 'datetime' = 'date'
  ): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return (
      mode === 'datetime' ? this.dateTimeFormatter : this.dateFormatter
    ).format(date);
  }
}

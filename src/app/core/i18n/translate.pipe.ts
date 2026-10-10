import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(value: unknown, params?: Record<string, unknown>): string { return this.i18n.translate(value, params); }
}

@Pipe({ name: 'localizedDate', standalone: true, pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(value: string | undefined, fallback = ''): string {
    if (!value || !Number.isFinite(new Date(value).getTime())) return fallback;
    if (fallback.startsWith('Publicado em') || fallback.startsWith('Published on') || fallback.startsWith('Publicado el')) {
      const date = new Date(value);
      return this.i18n.translate('Publicado em {date}, as {time}', {
        date: new Intl.DateTimeFormat(this.i18n.language()).format(date),
        time: new Intl.DateTimeFormat(this.i18n.language(), { hour: '2-digit', minute: '2-digit' }).format(date),
      });
    }
    return new Intl.DateTimeFormat(this.i18n.language(), { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }
}

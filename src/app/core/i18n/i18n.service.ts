import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { normalizeText, TRANSLATIONS } from './translations';

export type Language = 'pt-BR' | 'en-US' | 'es';
const STORAGE_KEY = 'spectrum.language';
const supported = (value: unknown): value is Language => ['pt-BR', 'en-US', 'es'].includes(value as string);

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  readonly language = signal<Language>(this.readLanguage());

  constructor() {
    effect(() => { this.document.documentElement.lang = this.language(); });
  }

  setLanguage(value: string): void {
    this.language.set(supported(value) ? value : 'pt-BR');
    try { this.document.defaultView?.localStorage.setItem(STORAGE_KEY, this.language()); } catch { /* Storage may be disabled. */ }
  }

  translate(value: unknown, params?: Record<string, unknown>): string {
    if (value == null) return '';
    const source = String(value);
    const language = this.language();
    const translated = TRANSLATIONS.get(normalizeText(source));
    const text = language === 'pt-BR' || !translated ? source
      : (source.match(/^\s*/)?.[0] ?? '') + translated[language === 'en-US' ? 0 : 1] + (source.match(/\s*$/)?.[0] ?? '');
    return params ? text.replace(/\{(\w+)\}/g, (token, key) => params[key] == null ? token : String(params[key])) : text;
  }

  private readLanguage(): Language {
    try {
      const value = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return supported(value) ? value : 'pt-BR';
    } catch { return 'pt-BR'; }
  }
}

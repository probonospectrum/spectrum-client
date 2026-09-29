import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'spectrum-theme';
  private readonly darkModeState = signal(this.readStoredTheme());

  readonly darkMode = this.darkModeState.asReadonly();

  constructor() {
    this.applyTheme(this.darkModeState());
  }

  setDarkMode(enabled: boolean): void {
    this.darkModeState.set(enabled);
    localStorage.setItem(this.storageKey, enabled ? 'dark' : 'light');
    this.applyTheme(enabled);
  }

  private applyTheme(enabled: boolean): void {
    this.document.documentElement.dataset['theme'] = enabled ? 'dark' : 'light';
    this.document.documentElement.style.colorScheme = enabled ? 'dark' : 'light';
  }

  private readStoredTheme(): boolean {
    return localStorage.getItem(this.storageKey) === 'dark';
  }
}

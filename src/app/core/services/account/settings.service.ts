import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';
import { ThemeService } from '../theme/theme.service';
import { UserService } from '../user/user.service';

export interface UserSettings {
  language: string;
  compactMode: boolean;
  privateAccount: boolean;
  darkTheme: boolean;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  importantUpdates: boolean;
  securityAlerts: boolean;
  news: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'pt-BR', compactMode: false, privateAccount: false, darkTheme: false,
  inAppNotifications: true, emailNotifications: true, importantUpdates: true,
  securityAlerts: true, news: false,
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);
  private readonly theme = inject(ThemeService);
  private readonly url = `${API_BASE_URL}/user/me/settings`;
  private readonly accountId = computed(() => this.users.currentUser()?._id);
  readonly preferences = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    effect((onCleanup) => {
      const user = this.accountId();
      this.preferences.set({ ...DEFAULT_SETTINGS });
      this.error.set('');
      this.theme.setDarkMode(false);
      if (!user) { this.loading.set(false); return; }
      this.loading.set(true);
      const request = this.http.get<UserSettings>(this.url).subscribe({
        next: (settings) => { this.apply(settings); this.loading.set(false); },
        error: () => { this.error.set('Não foi possível carregar suas preferências.'); this.loading.set(false); },
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  save(patch: Partial<UserSettings>): Observable<UserSettings> {
    const accountId = this.users.currentUser()?._id;
    return this.http.patch<UserSettings>(this.url, patch).pipe(tap((settings) => {
      if (this.users.currentUser()?._id === accountId) { this.apply(settings); this.error.set(''); }
    }));
  }

  private apply(settings: UserSettings): void {
    this.preferences.set({ ...DEFAULT_SETTINGS, ...settings });
    this.theme.setDarkMode(settings.darkTheme);
  }
}

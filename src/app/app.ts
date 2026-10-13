import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme/theme.service';
import { SettingsService } from './core/services/account/settings.service';
import { NotificationService } from './core/services/notifications/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly notifications = inject(NotificationService);
  private readonly themeService = inject(ThemeService);
  private readonly settingsService = inject(SettingsService);
  protected readonly title = signal('spectrum-client');
}

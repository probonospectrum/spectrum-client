import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, Input } from '@angular/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-settings-section',
  templateUrl: './settings-section.html',
  styleUrl: './settings-section.scss',
})
export class SettingsSection {
  @Input() title = '';
  @Input() description = '';
}

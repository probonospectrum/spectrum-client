import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.scss',
})
export class ToggleSwitch {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() label = '';
  @Output() checkedChange = new EventEmitter<boolean>();

  change(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.checked;
    input.checked = this.checked;
    this.checkedChange.emit(value);
  }
}

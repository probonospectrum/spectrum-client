import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.scss',
})
export class ToggleSwitch {
  @Input() checked = false;
  @Input() label = '';
  @Output() checkedChange = new EventEmitter<boolean>();
}

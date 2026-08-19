import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileData } from '../../../core/services/account/account-mock.service';

@Component({
  selector: 'app-profile-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-form.html',
  styleUrl: './profile-form.scss',
})
export class ProfileForm {
  @Input({ required: true }) profile!: ProfileData;
  @Input() editing = false;
  @Output() profileChange = new EventEmitter<ProfileData>();

  update(field: keyof ProfileData, value: string): void {
    this.profileChange.emit({ ...this.profile, [field]: value });
  }
}

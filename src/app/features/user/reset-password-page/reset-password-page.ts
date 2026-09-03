import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { Button } from '../../../shared/components/button/button';
import { SpectrumInput } from '../../../shared/components/input/input/input';

@Component({
  selector: 'app-reset-password-page',
  imports: [
    ReactiveFormsModule,
    AuthShell,
    Button,
    SpectrumInput,
  ],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly resetPasswordForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(30)]],
    confirmPassword: ['', Validators.required],
  });

  fieldError(controlName: 'password' | 'confirmPassword'): string {
    const control = this.resetPasswordForm.controls[controlName];

    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Campo obrigatorio';
    }

    if (control.hasError('minlength')) {
      return 'A senha deve ter no minimo 10 caracteres';
    }

    if (control.hasError('maxlength')) {
      return 'A senha deve ter no maximo 30 caracteres';
    }

    return 'Valor invalido';
  }

  resetPassword(): void {
    this.resetPasswordForm.markAllAsTouched();

    if (this.resetPasswordForm.invalid) {
      return;
    }

    // A lógica de redefinição será implementada posteriormente.
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
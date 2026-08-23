import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { Button } from '../../../shared/components/button/button';
import { SpectrumInput } from '../../../shared/components/input/input/input';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    ReactiveFormsModule,
    AuthShell,
    Button,
    SpectrumInput,
    RouterLink
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.scss',
})
export class ForgotPasswordPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  fieldError(): string {
    const control = this.forgotPasswordForm.controls.email;

    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Campo obrigatorio';
    }

    if (control.hasError('email')) {
      return 'Digite um email valido';
    }

    return 'Valor invalido';
  }

  sendResetLink(): void {
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    // A lógica de envio do email será implementada posteriormente.
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
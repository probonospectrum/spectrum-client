import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/services/authApi/auth-api.service';

import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { Button } from '../../../shared/components/button/button';
import { SpectrumInput } from '../../../shared/components/input/input/input';

@Component({
  selector: 'app-forgot-password-page',
  imports: [TranslatePipe,
    ReactiveFormsModule,
    AuthShell,
    Button,
    SpectrumInput,
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.scss',
})
export class ForgotPasswordPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

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

    if (this.forgotPasswordForm.invalid || this.submitting() || this.sent()) {
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    const email = this.forgotPasswordForm.controls.email.value;
    this.authApi.requestPasswordReset(email).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: () => this.sent.set(true),
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404 &&
            error.error?.message === 'Usuario nao encontrado.') {
          this.sent.set(true);
          return;
        }
        this.error.set('Não foi possível solicitar o link. Tente novamente.');
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}

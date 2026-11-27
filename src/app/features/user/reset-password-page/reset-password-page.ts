import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/services/authApi/auth-api.service';

import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { Button } from '../../../shared/components/button/button';
import { SpectrumInput } from '../../../shared/components/input/input/input';

@Component({
  selector: 'app-reset-password-page',
  imports: [TranslatePipe,
    ReactiveFormsModule,
    AuthShell,
    Button,
    SpectrumInput,
    RouterLink,
  ],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token')?.trim();
  readonly submitting = signal(false);
  readonly complete = signal(false);
  readonly invalidLink = signal(!this.token);
  readonly error = signal('');

  readonly resetPasswordForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(30)]],
    confirmPassword: ['', Validators.required],
  });

  fieldError(controlName: 'password' | 'confirmPassword'): string {
    const control = this.resetPasswordForm.controls[controlName];

    if (!control.touched) return '';

    if (controlName === 'confirmPassword' && control.value &&
        control.value !== this.resetPasswordForm.controls.password.value) {
      return 'As senhas não conferem.';
    }
    if (control.valid) {
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

    const { password, confirmPassword } = this.resetPasswordForm.getRawValue();
    if (this.resetPasswordForm.invalid || password !== confirmPassword ||
        !this.token || this.invalidLink() || this.submitting() || this.complete()) {
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    this.authApi.resetPassword(this.token, password, confirmPassword).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: () => {
        this.resetPasswordForm.reset();
        this.complete.set(true);
      },
      error: (error: unknown) => {
        const message = error instanceof HttpErrorResponse ? error.error?.message : null;
        if (message === 'Link invalido ou expirado.' || message === 'Token invalido para esta operacao.') {
          this.invalidLink.set(true);
          return;
        }
        this.error.set('Não foi possível redefinir a senha. Tente novamente.');
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}

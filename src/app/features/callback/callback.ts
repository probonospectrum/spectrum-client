import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { GoogleAuthService } from '../../core/services/user/google-auth.service';
import {
  AuthApiService,
  requiresGoogleRegistration,
} from '../../core/services/authApi/auth-api.service';
import { AlertPopup } from '../../shared/components/alert-popup/alert-popup';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [AlertPopup],
  template: `
    <div class="callback-loading" role="status" aria-live="polite">
      @if (!errorMessage()) {
        <div class="spinner" aria-hidden="true"></div>
        <p>Concluindo seu login com Google...</p>
      }
    </div>
    @if (errorMessage(); as message) {
      <app-alert-popup
        type="error"
        title="Não foi possível entrar com Google"
        [message]="message"
        actionLabel="Voltar ao login"
        (dismissed)="backToLogin()"
      />
    }
  `,
  styles: [
    `
      .callback-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: #0a0a0a;
        color: #fff;
      }
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class CallbackPage implements OnInit {
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly authApiService = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    let code: string | null;
    try {
      code = this.googleAuth.getAuthorizationCode();
      if (!code)
        throw new Error('O Google não retornou um código de autorização. Tente novamente.');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Tente fazer login novamente.',
      );
      return;
    }

    this.authApiService
      .loginWithGoogle(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) =>
          void this.router.navigate(
            requiresGoogleRegistration(response) ? ['/cadastro'] : ['/publicacoes'],
            {
              replaceUrl: true,
              queryParams: requiresGoogleRegistration(response) ? { google: '1' } : {},
            },
          ),
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse) {
            this.errorMessage.set(
              error.status === 0
                ? 'Não foi possível conectar ao servidor do Spectrum. Verifique se a API está disponível.'
                : 'O servidor não conseguiu concluir o login com Google. Tente novamente; se persistir, contate a equipe do Spectrum.',
            );
          } else {
            this.errorMessage.set(
              error instanceof Error && error.name === 'TimeoutError'
                ? 'O servidor demorou para responder. Aguarde alguns instantes e tente novamente.'
                : 'O servidor não retornou uma sessão válida. Tente novamente.',
            );
          }
        },
      });
  }

  backToLogin(): void {
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}

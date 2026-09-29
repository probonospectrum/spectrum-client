import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertPopup, AlertPopupType } from '../../../shared/components/alert-popup/alert-popup';
import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { Button } from '../../../shared/components/button/button';
import { UserWebsocketService } from '../../../core/services/user/user-websocket.service';

type VerificationStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-email-page',
  imports: [AlertPopup, AuthShell, Button],
  templateUrl: './verify-email-page.html',
  styleUrl: './verify-email-page.scss',
})
export class VerifyEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userWebsocketService = inject(UserWebsocketService);
  private readonly destroyRef = inject(DestroyRef);

  status = signal<VerificationStatus>('loading');
  title = signal('Verificando email');
  message = signal('Estamos confirmando seu cadastro. Isso leva alguns segundos.');
  alert = signal<{ type: AlertPopupType; title: string; message: string; actionLabel: string } | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.showResult(
        'error',
        'Link invalido',
        'Nao encontramos o token de verificacao neste link. Solicite um novo email de confirmacao.',
      );
      return;
    }

    this.userWebsocketService
      .verifyEmail(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        this.showResult(
          'success',
          'Email verificado',
          response.message || 'Seu email foi confirmado com sucesso.',
        );
      },
      error: (error: unknown) => {
        this.showResult(
          'error',
          'Nao foi possivel verificar',
          error instanceof Error
            ? error.message
            : 'O link pode estar invalido ou expirado. Tente solicitar uma nova verificacao.',
        );
      },
    });
  }

  goToLogin(): void {
    void this.router.navigateByUrl('/login');
  }

  dismissAlert(): void {
    this.alert.set(null);
  }

  private showResult(type: AlertPopupType, title: string, message: string): void {
    this.status.set(type);
    this.title.set(title);
    this.message.set(message);
    this.alert.set({
      type,
      title,
      message,
      actionLabel: type === 'success' ? 'Entrar na conta' : 'Entendi',
    });
  }
}

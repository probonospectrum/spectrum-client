import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { PublicAgencyService, AgencyStatus } from '../../core/services/user/public-agency.service';
import { UserService } from '../../core/services/user/user.service';
import { SocialShell } from '../../shared/components/social-shell/social-shell';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { OCCURRENCE_STATUS_DETAILS } from '../../core/services/posts/occurrence-flow';
import { OccurrenceStatus } from '../../core/services/posts/post.service';
@Component({
  selector: 'app-public-agency-page',
  imports: [RouterLink, TranslatePipe, SocialShell],
  templateUrl: './public-agency-page.html',
  styleUrl: './public-agency.scss',
})
export class PublicAgencyPage {
  private readonly api = inject(PublicAgencyService);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  get user() {
    return this.users.getCurrentUser();
  }
  status = signal<AgencyStatus | null>(null);
  busy = signal(false);
  error = '';
  message = '';
  occurrences = signal<{ _id: string; title: string; status: string }[]>([]);
  constructor() {
    this.refresh();
  }
  label(value: string) {
    return (
      (
        {
          PENDING: 'Aguardando verificação',
          APPROVED: 'Conta institucional aprovada',
          REJECTED: 'Solicitação recusada',
          REVOKED: 'Representação revogada',
        } as Record<string, string>
      )[value] || value
    );
  }
  occurrenceLabel(value: string) {
    return OCCURRENCE_STATUS_DETAILS[value as OccurrenceStatus] || value;
  }
  refresh() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error = '';
    this.occurrences.set([]);
    this.api
      .status()
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (status) => {
          this.status.set(status);
          if (status.occurrenceRole === 'RESPONSIBLE_AGENCY')
            this.api
              .assigned()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (items) => this.occurrences.set(items),
                error: () => (this.error = 'Não foi possível carregar os atendimentos.'),
              });
        },
        error: () => (this.error = 'Não foi possível consultar sua conta institucional.'),
      });
  }
  resend() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error = '';
    this.api
      .resend()
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => (this.message = response.message),
        error: (error) =>
          (this.error = error.error?.message || 'Não foi possível reenviar o link.'),
      });
  }
  logout() {
    this.users.logout();
    void this.router.navigate(['/login']);
  }
}

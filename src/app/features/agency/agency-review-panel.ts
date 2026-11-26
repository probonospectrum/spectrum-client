import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { PublicAgencyService, AgencyRequest } from '../../core/services/user/public-agency.service';
import { PostService } from '../../core/services/posts/post.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
@Component({
  selector: 'app-agency-review-panel',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './agency-review-panel.html',
  styleUrl: './public-agency.scss',
})
export class AgencyReviewPanel {
  statusLabel(status: string) {
    return (
      (
        {
          PENDING: 'Aguardando verificação',
          APPROVED: 'Aprovada',
          REJECTED: 'Recusada',
          REVOKED: 'Revogada',
        } as Record<string, string>
      )[status] || status
    );
  }
  private readonly api = inject(PublicAgencyService);
  private readonly posts = inject(PostService);
  private readonly destroyRef = inject(DestroyRef);
  requests = signal<AgencyRequest[]>([]);
  busy = signal(false);
  error = '';
  message = '';
  selected: AgencyRequest | null = null;
  agencies: { _id: string; name: string }[] = [];
  agencyId = '';
  decision = 'APPROVED';
  officialName = '';
  natureCode = '1031';
  stateCode = '';
  cities = '';
  categories = ['OUTROS'];
  contactEmail = '';
  sourceUrl = '';
  note = '';
  readonly categoryOptions = [
    { value: 'INFRAESTRUTURA', label: 'Infraestrutura' },
    { value: 'ILUMINACAO_PUBLICA', label: 'Iluminação pública' },
    { value: 'TRANSITO', label: 'Trânsito' },
    { value: 'LIMPEZA_URBANA', label: 'Limpeza urbana' },
    { value: 'SEGURANCA', label: 'Segurança' },
    { value: 'MEIO_AMBIENTE', label: 'Meio ambiente' },
    { value: 'ACESSIBILIDADE', label: 'Acessibilidade' },
    { value: 'OUTROS', label: 'Outros' },
  ];
  constructor() {
    this.refresh();
    this.posts
      .getRegisteredAgencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (items) => (this.agencies = items), error: () => {} });
  }
  refresh() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error = '';
    this.api
      .requests()
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => this.requests.set(items),
        error: () => (this.error = 'Não foi possível carregar as solicitações.'),
      });
  }
  select(request: AgencyRequest) {
    this.selected = request;
    this.decision = request.agencyRegistration.status === 'APPROVED' ? 'REVOKED' : 'APPROVED';
    this.agencyId = '';
    this.officialName = request.agencyRegistration.name;
    this.natureCode = '';
    this.stateCode = '';
    this.cities = '';
    this.categories = ['OUTROS'];
    this.contactEmail = '';
    this.sourceUrl = '';
    this.note = '';
    this.message = '';
  }
  submit() {
    if (!this.selected || this.busy()) return;
    this.busy.set(true);
    this.error = '';
    this.api
      .review(this.selected._id, {
        decision: this.decision,
        note: this.note.trim(),
        sourceUrl: this.sourceUrl,
        ...(this.decision === 'APPROVED'
          ? {
              agencyId: this.agencyId || undefined,
              officialName: this.officialName.trim(),
              natureCode: this.natureCode.replace(/-/g, ''),
              stateCode: this.stateCode.toUpperCase(),
              cities: this.cities
                .split(',')
                .map((city) => city.trim())
                .filter(Boolean),
              categories: this.categories,
              contactEmail: this.contactEmail.trim(),
            }
          : {}),
      })
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (item) => {
          this.requests.update((items) => items.map((x) => (x._id === item._id ? item : x)));
          this.selected = null;
          this.message = 'Revisão salva com histórico de verificação.';
        },
        error: (error) =>
          (this.error = Array.isArray(error.error?.message)
            ? error.error.message.join(' ')
            : error.error?.message || 'Não foi possível salvar a revisão.'),
      });
  }
}

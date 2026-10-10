import { LocalizedDatePipe, TranslatePipe } from '../../core/i18n/translate.pipe';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { SocialShell } from '../../shared/components/social-shell/social-shell';
import { PostService, SpectrumPost } from '../../core/services/posts/post.service';
import { UserService } from '../../core/services/user/user.service';

@Component({
  selector: 'app-moderation-page',
  imports: [LocalizedDatePipe, TranslatePipe, CommonModule, FormsModule, RouterLink, SocialShell],
  templateUrl: './moderation-page.html',
  styleUrl: './moderation-page.scss',
})
export class ModerationPage {
  private readonly posts = inject(PostService);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly user = this.users.getCurrentUser();
  readonly loading = signal(false);
  readonly items = signal<SpectrumPost[]>([]);
  error = '';
  search = '';
  filter = 'all';
  readonly filters = [
    { value: 'all', label: 'Todas' }, { value: 'pending', label: 'Pendências' },
    { value: 'sent', label: 'Aguardando retorno' }, { value: 'review', label: 'Respostas para analisar' },
    { value: 'resolved', label: 'Resolvidas' },
  ];
  constructor() { this.load(); }
  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error = '';
    this.posts.getModerationOccurrences(this.user).pipe(
      finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: items => this.items.set(items), error: () => {
      this.error = 'Não foi possível carregar as ocorrências. Verifique sua conexão e sua permissão de moderador.';
    } });
  }
  get pendingCount(): number { return this.items().filter(p => !!p.moderationReason).length; }
  get reviewCount(): number { return this.items().filter(p => p.status === 'RESPOSTA_EM_APURACAO').length; }
  get visible(): SpectrumPost[] {
    const term = this.search.trim().toLocaleLowerCase();
    return this.items().filter(p => {
      const matches = this.filter === 'all' ||
        (this.filter === 'pending' && !!p.moderationReason) ||
        (this.filter === 'sent' && p.status === 'ENCAMINHADA') ||
        (this.filter === 'review' && p.status === 'RESPOSTA_EM_APURACAO') ||
        (this.filter === 'resolved' && p.status === 'RESOLVIDA');
      return matches && (!term || [p.title, p.id, p.location?.cityName, p.location?.city,
        p.responsibleAgency?.name].some(v => v?.toLocaleLowerCase().includes(term)));
    });
  }
  status(post: SpectrumPost): string { return this.posts.getStatusLabel(post.status); }
  action(post: SpectrumPost): string {
    if (post.status === 'RESPOSTA_EM_APURACAO') return 'Analisar resposta';
    if (post.status === 'ENCAMINHADA' || post.status === 'EM_RESOLUCAO') return 'Registrar resposta';
    if (post.moderationReason) return 'Ver pendência';
    return 'Ver ocorrência';
  }
  guidance(post: SpectrumPost): string {
    const reasons: Record<string, string> = {
      ORGAO_NAO_IDENTIFICADO: 'Selecione um órgão cadastrado para encaminhar.',
      EMPATE_DE_ORGAO_RESPONSAVEL: 'Mais de um órgão corresponde ao relato. Confira a competência.',
      CONTATO_INVALIDO: 'O órgão não possui um contato válido. É necessário revisar o catálogo.',
      FALHA_NO_ENCAMINHAMENTO: 'O envio falhou. Confira o histórico antes de tentar novamente.',
      RESPOSTA_EM_APURACAO: 'Confira a resposta e classifique o resultado.',
      SEM_RETORNO_APOS_REENVIO: 'O reenvio já ocorreu e ainda não há resposta.',
      REJEITADA_PARA_REAVALIACAO: 'O órgão rejeitou a ocorrência. Ela precisa de reavaliação.',
      ENVIO_INTERROMPIDO: 'Envio com resultado incerto. Requer conferência técnica antes de reenviar.',
      PROCESSAMENTO_INTERROMPIDO: 'Processamento interrompido. Requer conferência técnica.',
    };
    return reasons[post.moderationReason || ''] || (post.status === 'RESOLVIDA'
      ? 'Resolução validada pela moderação.' : post.status === 'ENCAMINHADA'
      ? 'Aguardando retorno do órgão. Registre a mensagem quando recebê-la.'
      : 'Abra os detalhes para acompanhar o status e as próximas ações.');
  }
  logout(): void { this.users.logout(); void this.router.navigate(['/login']); }
}

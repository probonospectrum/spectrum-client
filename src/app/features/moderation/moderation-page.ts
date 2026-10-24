import { CONTENT_REVIEW_MESSAGE, requiresContentReview } from '../../core/content-policy/content-policy';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, merge, switchMap, of, map, catchError, tap, finalize } from 'rxjs';
import { SocialShell } from '../../shared/components/social-shell/social-shell';
import { PostService, SpectrumPost, ModerationReport } from '../../core/services/posts/post.service';
import { UserService } from '../../core/services/user/user.service';

@Component({
  selector: 'app-moderation-page', imports: [FormsModule, RouterLink, SocialShell],
  templateUrl: './moderation-page.html', styleUrl: './moderation-page.scss',
})
export class ModerationPage {
  private readonly posts = inject(PostService);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new Subject<void>();
  readonly user = this.users.getCurrentUser();
  readonly loading = signal(false);
  readonly items = signal<SpectrumPost[]>([]);
  readonly reports = signal<ModerationReport[]>([]);
  queue = '';
  search = '';
  error = '';
  readonly titles: Record<string, string> = { resolvidas: 'Resolvidas', 'sem-orgao': 'Sem órgão',
    contestadas: 'Contestadas', denunciados: 'Itens denunciados', respostas: 'Respostas para Análise' };
  constructor() {
    merge(this.route.paramMap, this.refresh).pipe(
      tap(() => {
        this.queue = this.route.snapshot.paramMap.get('queue') || 'sem-orgao';
        this.error = ''; this.loading.set(true); this.items.set([]); this.reports.set([]);
      }),
      switchMap(() => {
        if (!this.titles[this.queue]) { void this.router.navigate(['/moderacao/sem-orgao']); return of(null); }
        const request = this.queue === 'denunciados'
          ? this.posts.getModerationReports().pipe(map(reports => ({ reports, items: [] as SpectrumPost[] })))
          : this.posts.getModerationOccurrences(this.user, this.queue).pipe(map(items => ({ items, reports: [] as ModerationReport[] })));
        return request.pipe(catchError(() => { this.error = 'Não foi possível carregar esta fila. Verifique sua conexão e permissão.'; return of(null); }));
      }), takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      if (result) { this.items.set(result.items); this.reports.set(result.reports); }
      this.loading.set(false);
    });
  }
  readonly removalPending = signal(false);
  removalTarget: ModerationReport | null = null;
  removalReason = '';
  removalError = '';
  beginRemoval(item: ModerationReport): void {
    if (item.kind !== 'post' || item.removedAt || this.removalPending()) return;
    this.removalTarget = item; this.removalReason = ''; this.removalError = '';
  }
  cancelRemoval(): void { if (!this.removalPending()) this.removalTarget = null; }
  confirmRemoval(): void {
    const item = this.removalTarget;
    if (!item || this.removalPending()) return;
    if (!this.removalReason.trim()) { this.removalError = 'Informe a justificativa da análise.'; return; }
    if (requiresContentReview(this.removalReason)) { this.removalError = CONTENT_REVIEW_MESSAGE; return; }
    this.removalPending.set(true); this.removalError = '';
    this.posts.removeReportedPost(item.postId || item.id, this.removalReason.trim()).pipe(
      finalize(() => this.removalPending.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: () => { this.removalTarget = null; this.load(); }, error: error => {
      this.removalError = typeof error.error?.message === 'string' ? error.error.message : 'Não foi possível remover. Tente novamente.';
    } });
  }
  load(): void { this.refresh.next(); }
  get title(): string { return this.titles[this.queue] || 'Moderação'; }
  get visible(): SpectrumPost[] {
    const term = this.search.trim().toLocaleLowerCase();
    return this.items().filter(p => !term || [p.title, p.content, p.responsibleAgency?.name, p.location?.cityName]
      .some(value => value?.toLocaleLowerCase().includes(term)));
  }
  get visibleReports(): ModerationReport[] {
    const term = this.search.trim().toLocaleLowerCase();
    return this.reports().filter(p => !term || [p.title, p.content, ...p.reasons].some(v => v?.toLocaleLowerCase().includes(term)));
  }
  review(post: SpectrumPost) { return [...(post.history || [])].reverse().find(e => e.eventType === 'OCORRENCIA_RESOLVIDA'); }
  resolutionNote(post: SpectrumPost): string { return String(this.review(post)?.metadata?.['note'] || this.review(post)?.description || ''); }
  resolutionEvidence(post: SpectrumPost) {
    const ids = this.review(post)?.evidenceIds || [];
    return post.evidences.filter(e => ids.includes(e.id));
  }
  contestations(post: SpectrumPost) { return (post.history || []).filter(e => e.eventType === 'RESOLUCAO_CONTESTADA'); }
  contestEvidence(post: SpectrumPost, ids?: string[]) { return post.evidences.filter(e => ids?.includes(e.id)); }
  status(post: SpectrumPost): string { return this.posts.getStatusLabel(post.status); }
  logout(): void { this.users.logout(); void this.router.navigate(['/login']); }
}

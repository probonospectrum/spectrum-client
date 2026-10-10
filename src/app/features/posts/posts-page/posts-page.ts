import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { SettingsService } from '../../../core/services/account/settings.service';
import {
  OccurrenceCategory,
  PostService,
  SpectrumPost,
} from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';

import {
  AlertPopup,
  AlertPopupType,
} from '../../../shared/components/alert-popup/alert-popup';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

import { occurrenceStage, OccurrenceStage } from '../../../core/services/posts/occurrence-flow';

interface FeedAlert {
  type: AlertPopupType;
  title: string;
  message: string;
}

@Component({
  selector: 'app-posts-page',
  imports: [TranslatePipe,
    CommonModule,
    SocialShell,
    PostCard,
    ReportModal,
    AlertPopup,
  ],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.scss',
})
export class PostsPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly settingsService = inject(SettingsService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;

  allPosts = signal<SpectrumPost[]>([]);
  feedLoading = signal(true);
  feedError = signal('');
  loadingMore = signal(false);
  hasMore = signal(false);
  private nextCursor: string | null = null;
  readonly selectedStage = signal<OccurrenceStage | 'Todas'>('Todas');
  readonly selectedCategory = signal<OccurrenceCategory | ''>('');
  readonly stages: Array<OccurrenceStage | 'Todas'> = ['Todas', 'Aberta', 'Em andamento', 'Fechada'];
  readonly categoryFilters: Array<{ value: OccurrenceCategory | ''; label: string; icon: string }> = [
    { value: '', label: 'Todas', icon: 'grid_view' },
    { value: 'INFRAESTRUTURA', label: 'Infraestrutura', icon: 'construction' },
    { value: 'ILUMINACAO_PUBLICA', label: 'Iluminação', icon: 'lightbulb' },
    { value: 'LIMPEZA_URBANA', label: 'Limpeza', icon: 'delete_sweep' },
    { value: 'ACESSIBILIDADE', label: 'Acessibilidade', icon: 'accessible' },
    { value: 'TRANSITO', label: 'Trânsito', icon: 'traffic' },
    { value: 'SEGURANCA', label: 'Segurança', icon: 'shield' },
    { value: 'MEIO_AMBIENTE', label: 'Meio ambiente', icon: 'park' },
    { value: 'OUTROS', label: 'Outros', icon: 'more_horiz' },
  ];

  get hasFilters(): boolean {
    return this.selectedStage() !== 'Todas' || this.selectedCategory() !== '';
  }

  clearFilters(): void {
    this.selectedStage.set('Todas');
    this.selectedCategory.set('');
  }

  private readonly categoryList = viewChild<ElementRef<HTMLElement>>('categoryList');
  readonly canScrollCategoriesBack = signal(false);
  readonly canScrollCategoriesForward = signal(false);
  readonly loopCategories = signal(false);

  constructor() {
    afterNextRender(() => {
      const list = this.categoryList()?.nativeElement;
      if (!list) return;

      const observer = new ResizeObserver(() => this.updateCategoryScroll(list));
      observer.observe(list);
      for (const category of Array.from(list.children)) observer.observe(category);
      this.updateCategoryScroll(list);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  updateCategoryScroll(list: HTMLElement): void {
    this.loopCategories.set(window.matchMedia('(max-width: 780px)').matches);
    const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    this.canScrollCategoriesBack.set(list.scrollLeft > 1);
    this.canScrollCategoriesForward.set(list.scrollLeft < maxScroll - 1);
  }

  scrollCategories(list: HTMLElement, direction: -1 | 1): void {
    const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    let target = Math.max(0, Math.min(maxScroll, list.scrollLeft + direction * list.clientWidth));
    if (this.loopCategories() && maxScroll > 1) {
      if (direction === 1 && list.scrollLeft >= maxScroll - 1) target = 0;
      if (direction === -1 && list.scrollLeft <= 1) target = maxScroll;
    }
    if (Math.abs(target - list.scrollLeft) <= 1) return;

    list.scrollTo({
      left: target,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  reportPost: SpectrumPost | null = null;

  selectedReason = 'Discurso de odio';

  feedAlert = signal<FeedAlert | null>(null);

  private readonly hiddenPostIds = new Set<string>();
  private readonly hiddenAuthorNicknames = new Set<string>();

  readonly reportReasons = [
    'Discurso de odio',
    'Abuso ou assedio',
    'Conteudo sexual',
    'Seguranca infantil',
  ];

  get posts(): SpectrumPost[] {
    return this.allPosts().filter(
      (post) =>
        !this.hiddenPostIds.has(post.id) &&
        !this.hiddenAuthorNicknames.has(post.authorNickname) &&
        (this.selectedStage() === 'Todas' || occurrenceStage(post.status) === this.selectedStage()) &&
        (!this.selectedCategory() || post.category === this.selectedCategory()),
    );
  }

  get displayName(): string {
    return this.user?.name || 'Usuario Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    if (this.router.url.includes('criar=1')) {
      this.openCreatePost();
    }

    this.refreshPosts();

  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.reportPost = null;
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  openCreatePost(): void {
    void this.router.navigate([], {
      queryParams: {
        criar: '1',
      },
      queryParamsHandling: 'merge',
    });
  }

  openReport(
    post: SpectrumPost,
    reason = this.reportReasons[0],
  ): void {
    this.reportPost = post;
    this.selectedReason = reason;
  }

  confirmReport(): void {
    this.reportPost = null;

    this.feedAlert.set({
      type: 'success',
      title: 'Denuncia enviada',
      message:
        'Obrigado por ajudar a manter a comunidade mais segura.',
    });
  }

  deletePost(post: SpectrumPost): void {
    this.postService.removeServerPost(post).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.refreshPosts(); this.feedAlert.set({ type: 'success', title: 'Repost excluído', message: 'O repost foi removido.' }); },
      error: () => this.feedAlert.set({ type: 'error', title: 'Não foi possível excluir', message: 'Ocorrências preservam seu histórico. Apenas reposts próprios podem ser excluídos.' }),
    });
  }

  toggleRepost(post: SpectrumPost): void {
    this.postService.toggleServerRepost(post, this.user).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => { this.refreshPosts(); this.feedAlert.set({ type: 'success', title: result.reposted ? 'Repost realizado' : 'Repost removido', message: result.reposted ? 'A ocorrência foi adicionada ao seu perfil.' : 'O repost foi removido do seu perfil.' }); },
      error: () => this.feedAlert.set({ type: 'error', title: 'Não foi possível repostar', message: 'Tente novamente em instantes.' }),
    });
  }

  hideAuthor(post: SpectrumPost): void {
    this.hiddenAuthorNicknames.add(post.authorNickname);

    this.feedAlert.set({
      type: 'success',
      title: 'Publicacoes ocultadas',
      message: `Voce nao vera mais publicacoes de @${post.authorNickname} nesta sessao.`,
    });
  }

  hidePost(post: SpectrumPost): void {
    this.hiddenPostIds.add(post.id);

    this.feedAlert.set({
      type: 'success',
      title: 'Publicacao ocultada',
      message:
        'Usaremos esse sinal para melhorar suas recomendacoes.',
    });
  }

  copyPostLink(post: SpectrumPost): void {
    const occurrenceId = post.originalPostId ?? post.id;
    const link = `${window.location.origin}/occurrences/${encodeURIComponent(occurrenceId)}`;

    void navigator.clipboard
      .writeText(link)
      .then(() => {
        this.feedAlert.set({
          type: 'success',
          title: 'Link copiado',
          message:
            'O link da ocorrência foi copiado para a área de transferência.',
        });
      })
      .catch(() => {
        this.feedAlert.set({
          type: 'error',
          title: 'Nao foi possivel copiar',
          message: link,
        });
      });
  }

  onPostCreated(): void {
    this.refreshPosts();

    this.feedAlert.set({
      type: 'success',
      title: 'Ocorrência criada',
      message: 'Sua ocorrência já aparece no feed com o status Aberta.',
    });
  }

  onPostUpdated(): void {
    this.refreshPosts();

    this.feedAlert.set({
      type: 'success',
      title: 'Publicacao atualizada',
      message: 'As alteracoes ja aparecem no feed.',
    });
  }

  refreshPosts(): void {
    this.feedLoading.set(true);
    this.feedError.set('');
    this.nextCursor = null;
    this.postService.getFeed(this.user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.allPosts.set(page.data);
          this.nextCursor = page.nextCursor;
          this.hasMore.set(page.hasMore);
          this.feedLoading.set(false);
        },
        error: () => {
          this.allPosts.set([]);
          this.hasMore.set(false);
          this.feedError.set('Não foi possível carregar as ocorrências. Tente novamente.');
          this.feedLoading.set(false);
        },
      });
  }

  loadMore(): void {
    if (!this.nextCursor || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.postService.getFeed(this.user, this.nextCursor).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.allPosts.update((posts) => Array.from(new Map([...posts, ...page.data].map((post) => [post.id, post])).values()));
        this.nextCursor = page.nextCursor;
        this.hasMore.set(page.hasMore);
        this.loadingMore.set(false);
      },
      error: () => { this.loadingMore.set(false); this.feedAlert.set({ type: 'error', title: 'Falha ao carregar', message: 'Tente carregar mais ocorrências novamente.' }); },
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MockLoadingService } from '../../../core/services/loading/mock-loading.service';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { AlertPopup, AlertPopupType } from '../../../shared/components/alert-popup/alert-popup';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { LoadingIndicator } from '../../../shared/components/loading-indicator/loading-indicator';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

interface FeedAlert {
  type: AlertPopupType;
  title: string;
  message: string;
}

@Component({
  selector: 'app-posts-page',
  imports: [CommonModule, SocialShell, PostCard, ReportModal, AlertPopup, LoadingIndicator],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.scss',
})
export class PostsPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockLoadingService = inject(MockLoadingService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  allPosts = signal<SpectrumPost[]>([]);
  feedLoading = signal(true);
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
    'Parece spam de IA',
  ];

  get posts(): SpectrumPost[] {
    return this.allPosts().filter(
      (post) =>
        !this.hiddenPostIds.has(post.id) && !this.hiddenAuthorNicknames.has(post.authorNickname),
    );
  }

  ngOnInit(): void {
    this.refreshPosts();
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

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.reportPost = null;
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  openReport(post: SpectrumPost, reason = this.reportReasons[0]): void {
    this.reportPost = post;
    this.selectedReason = reason;
  }

  confirmReport(): void {
    this.reportPost = null;
    this.feedAlert.set({
      type: 'success',
      title: 'Denuncia enviada',
      message: 'Obrigado por ajudar a manter a comunidade mais segura.',
    });
  }

  deletePost(post: SpectrumPost): void {
    try {
      this.postService.deletePost(post.id, this.user);
      this.refreshPosts();
      this.feedAlert.set({
        type: 'success',
        title: 'Publicacao excluida',
        message: 'A publicacao foi removida do feed.',
      });
    } catch (error) {
      this.feedAlert.set({
        type: 'error',
        title: 'Nao foi possivel excluir',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    }
  }

  toggleRepost(post: SpectrumPost): void {
    try {
      const result = this.postService.toggleRepost(post, this.user);
      this.refreshPosts();
      this.feedAlert.set({
        type: 'success',
        title: result.reposted ? 'Repost realizado' : 'Repost removido',
        message: result.reposted
          ? 'A publicacao foi adicionada aos seus reposts.'
          : 'A publicacao saiu da sua lista de reposts.',
      });
    } catch (error) {
      this.feedAlert.set({
        type: 'error',
        title: 'Nao foi possivel repostar',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    }
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
      message: 'Usaremos esse sinal para melhorar suas recomendacoes.',
    });
  }

  copyPostLink(post: SpectrumPost): void {
    const link = `${window.location.origin}/publicacoes?post=${encodeURIComponent(post.id)}`;

    void navigator.clipboard
      .writeText(link)
      .then(() => {
        this.feedAlert.set({
          type: 'success',
          title: 'Link copiado',
          message: 'O link da publicacao foi copiado para a area de transferencia.',
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
      title: 'Publicacao criada',
      message: 'Sua publicacao ja aparece no feed.',
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

  private refreshPosts(): void {
    this.feedLoading.set(true);
    this.mockLoadingService
      .load(() => this.postService.getPosts(this.user))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((posts) => {
        this.allPosts.set(posts);
        this.feedLoading.set(false);
      });
  }
}

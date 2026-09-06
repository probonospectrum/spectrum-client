import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { AlertPopup, AlertPopupType } from '../../../shared/components/alert-popup/alert-popup';
import { InterestsPage } from '../../../features/interests/interests-page/interests-page';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

interface FeedAlert {
  type: AlertPopupType;
  title: string;
  message: string;
}

@Component({
  selector: 'app-posts-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SocialShell,
    PostCard,
    ReportModal,
    AlertPopup,
    InterestsPage,
  ],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.scss',
})
export class PostsPage implements OnInit {
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  allPosts = this.postService.getPosts(this.user);
  showCreatePost = false;
  showInterests = false;
  newPostContent = '';
  reportPost: SpectrumPost | null = null;
  selectedReason = 'Discurso de odio';
  feedAlert: FeedAlert | null = null;
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
    return this.allPosts.filter(
      (post) =>
        !this.hiddenPostIds.has(post.id) && !this.hiddenAuthorNicknames.has(post.authorNickname),
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
    if (this.route.snapshot.queryParamMap.get('criar') === '1') {
      this.openCreatePost();
    }

    this.showInterests = !this.userService.getInteresses(this.user)?.length;
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.reportPost = null;
    this.closeCreatePost();
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
    this.feedAlert = {
      type: 'success',
      title: 'Denuncia enviada',
      message: 'Obrigado por ajudar a manter a comunidade mais segura.',
    };
  }

  editPost(post: SpectrumPost): void {
    void this.router.navigate(['/publicacoes', post.id, 'editar']);
  }

  deletePost(post: SpectrumPost): void {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta publicacao?');

    if (!confirmed) {
      return;
    }

    try {
      this.postService.deletePost(post.id, this.user);
      this.refreshPosts();
      this.feedAlert = {
        type: 'success',
        title: 'Publicacao excluida',
        message: 'A publicacao foi removida do feed.',
      };
    } catch (error) {
      this.feedAlert = {
        type: 'error',
        title: 'Nao foi possivel excluir',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      };
    }
  }

  toggleRepost(post: SpectrumPost): void {
    try {
      const result = this.postService.toggleRepost(post, this.user);
      this.refreshPosts();
      this.feedAlert = {
        type: 'success',
        title: result.reposted ? 'Repost realizado' : 'Repost removido',
        message: result.reposted
          ? 'A publicacao foi adicionada aos seus reposts.'
          : 'A publicacao saiu da sua lista de reposts.',
      };
    } catch (error) {
      this.feedAlert = {
        type: 'error',
        title: 'Nao foi possivel repostar',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      };
    }
  }

  hideAuthor(post: SpectrumPost): void {
    this.hiddenAuthorNicknames.add(post.authorNickname);
    this.feedAlert = {
      type: 'success',
      title: 'Publicacoes ocultadas',
      message: `Voce nao vera mais publicacoes de @${post.authorNickname} nesta sessao.`,
    };
  }

  hidePost(post: SpectrumPost): void {
    this.hiddenPostIds.add(post.id);
    this.feedAlert = {
      type: 'success',
      title: 'Publicacao ocultada',
      message: 'Usaremos esse sinal para melhorar suas recomendacoes.',
    };
  }

  copyPostLink(post: SpectrumPost): void {
    const link = `${window.location.origin}/publicacoes?post=${encodeURIComponent(post.id)}`;

    void navigator.clipboard
      .writeText(link)
      .then(() => {
        this.feedAlert = {
          type: 'success',
          title: 'Link copiado',
          message: 'O link da publicacao foi copiado para a area de transferencia.',
        };
      })
      .catch(() => {
        this.feedAlert = {
          type: 'error',
          title: 'Nao foi possivel copiar',
          message: link,
        };
      });
  }

  openCreatePost(): void {
    this.showCreatePost = true;
  }

  closeCreatePost(): void {
    this.showCreatePost = false;
    this.newPostContent = '';

    if (this.route.snapshot.queryParamMap.has('criar')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { criar: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  publishPost(): void {
    const content = this.newPostContent.trim();

    if (!content) {
      return;
    }

    this.postService.createPost(
      {
        title: content.length > 72 ? `${content.slice(0, 69)}...` : content,
        content,
        authorCity: this.user?.cityUser || 'Localizacao nao informada',
        mediaType: 'text',
        tags: [],
      },
      this.user,
    );

    this.closeCreatePost();
    this.refreshPosts();
    this.feedAlert = {
      type: 'success',
      title: 'Publicacao criada',
      message: 'Sua publicacao ja aparece no feed.',
    };
  }

onInteressesEscolhidos(interesses: string[]): void {
  console.log('🟠 onInteressesEscolhidos RECEBIDO no pai', interesses);
  this.userService.salvarInteresses(this.user, interesses);
  this.showInterests = false;
  console.log('🔵 showInterests agora é', this.showInterests);
}

  private refreshPosts(): void {
    this.allPosts = this.postService.getPosts(this.user);
  }
}
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import {
  PublicProfile,
  PublicProfileMockService,
} from '../../../core/services/profile/public-profile-mock.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';
import { AlertPopup, AlertPopupType } from '../../../shared/components/alert-popup/alert-popup';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

interface ProfileAlert {
  type: AlertPopupType;
  title: string;
  message: string;
}

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, SocialShell, PostCard, AlertPopup],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly publicProfileService = inject(PublicProfileMockService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly user: LoggedUser | null = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;

  reposts = this.postService.getUserReposts(this.user);
  activeTab: 'posts' | 'reposts' | 'saved' = 'posts';
  profileAlert: ProfileAlert | null = null;
  private readonly hiddenPostIds = new Set<string>();
  private readonly hiddenAuthorNicknames = new Set<string>();

  /** Perfil publico carregado quando a rota tem :nickname de outro usuario. */
  publicProfile: PublicProfile | null = null;

  /** true quando estamos vendo o perfil de outra pessoa (nao o proprio). */
  isOwnProfile = true;

  reportingProfile = false;
  reportMenuOpen = false;
  isFollowing = false;

  /** Base de seguidores do perfil de terceiro, ajustada ao seguir/deixar de seguir. */
  private followersBase = 0;

  ngOnInit(): void {
    // Reage a mudancas do :nickname para reusar a mesma instancia do componente
    // ao navegar entre /perfil (proprio) e /perfil/:nickname (terceiro).
    this.route.paramMap.subscribe((params) => this.loadProfile(params));
  }

  private loadProfile(params: ParamMap): void {
    this.publicProfile = this.resolvePublicProfile(params.get('nickname'));
    this.isOwnProfile = this.publicProfile === null;
    this.followersBase = this.publicProfile?.followersCount ?? 0;

    // Reseta o estado de interacao ao trocar de perfil.
    this.isFollowing = false;
    this.reportingProfile = false;
    this.reportMenuOpen = false;
    this.activeTab = 'posts';
  }

  @HostListener('document:click')
  closeReportMenu(): void {
    this.reportMenuOpen = false;
  }

  toggleReportMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.reportMenuOpen = !this.reportMenuOpen;
  }

  get displayName(): string {
    if (this.publicProfile) {
      return this.publicProfile.name;
    }
    return this.user?.name || 'Usuário Spectrum';
  }

  get nickname(): string {
    if (this.publicProfile) {
      return this.publicProfile.nickname;
    }
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    if (this.publicProfile) {
      return this.publicProfile.initial;
    }
    return this.displayName.charAt(0).toUpperCase();
  }

  get coverUrl(): string {
    return (
      this.publicProfile?.coverUrl ||
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80'
    );
  }

  get joinedDate(): string {
    return this.publicProfile?.joinedDate || 'Janeiro de 2027';
  }

  get followingCount(): number {
    if (this.publicProfile) {
      return this.publicProfile.followingCount;
    }
    return this.user?.following?.length ?? 250;
  }

  get followersCount(): number {
    if (this.publicProfile) {
      return this.followersBase + (this.isFollowing ? 1 : 0);
    }
    return 350;
  }

  get userPosts(): SpectrumPost[] {
    const userNickname = this.nickname;

    if (this.publicProfile) {
      const mockPosts = this.publicProfileService.getPosts(userNickname);

      if (mockPosts.length) {
        return mockPosts;
      }

      // Perfil de terceiro sem posts mocados: usa os posts desse autor no feed.
      return this.postService
        .getPosts(this.user)
        .filter((post) => post.authorNickname === userNickname);
    }

    const allPosts = this.postService.getPosts(this.user);
    return allPosts.filter((post) => post.authorNickname === userNickname);
  }

  get visibleReposts(): SpectrumPost[] {
    return this.reposts.filter(
      (post) =>
        !this.hiddenPostIds.has(post.id) && !this.hiddenAuthorNicknames.has(post.authorNickname),
    );
  }

  get savedPosts(): SpectrumPost[] {
    return this.postService.getUserSavedPosts(this.user);
  }

  get visibleSavedPosts(): SpectrumPost[] {
    return this.savedPosts.filter(
      (post) =>
        !this.hiddenPostIds.has(post.id) && !this.hiddenAuthorNicknames.has(post.authorNickname),
    );
  }

  goToSettings(): void {
    void this.router.navigateByUrl('/configuracoes');
  }

  toggleFollow(): void {
    this.isFollowing = !this.isFollowing;
  }

  openReport(): void {
    this.reportMenuOpen = false;
    this.reportingProfile = true;
  }

  confirmReport(): void {
    this.reportingProfile = false;
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  toggleRepost(post: SpectrumPost): void {
    try {
      this.postService.toggleRepost(post, this.user);
      this.reposts = this.postService.getUserReposts(this.user);
    } catch (error) {
      this.profileAlert = {
        type: 'error',
        title: 'Nao foi possivel repostar',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      };
    }
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
      this.reposts = this.postService.getUserReposts(this.user);
      this.profileAlert = {
        type: 'success',
        title: 'Publicacao excluida',
        message: 'A publicacao foi removida.',
      };
    } catch (error) {
      this.profileAlert = {
        type: 'error',
        title: 'Nao foi possivel excluir',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      };
    }
  }

  hideAuthor(post: SpectrumPost): void {
    this.hiddenAuthorNicknames.add(post.authorNickname);
    this.profileAlert = {
      type: 'success',
      title: 'Publicacoes ocultadas',
      message: `Voce nao vera mais publicacoes de @${post.authorNickname} nesta aba.`,
    };
  }

  hidePost(post: SpectrumPost): void {
    this.hiddenPostIds.add(post.id);
    this.profileAlert = {
      type: 'success',
      title: 'Publicacao ocultada',
      message: 'A publicacao foi removida desta visualizacao.',
    };
  }

  reportPost(post: SpectrumPost, reason = 'Denunciar publicacao'): void {
    this.profileAlert = {
      type: 'success',
      title: 'Denuncia enviada',
      message: `${reason}: ${post.title}`,
    };
  }

  copyPostLink(post: SpectrumPost): void {
    const link = `${window.location.origin}/publicacoes?post=${encodeURIComponent(post.id)}`;

    void navigator.clipboard
      .writeText(link)
      .then(() => {
        this.profileAlert = {
          type: 'success',
          title: 'Link copiado',
          message: 'O link da publicacao foi copiado para a area de transferencia.',
        };
      })
      .catch(() => {
        this.profileAlert = {
          type: 'error',
          title: 'Nao foi possivel copiar',
          message: link,
        };
      });
  }

  private resolvePublicProfile(nickname: string | null): PublicProfile | null {
    if (!nickname) {
      return null;
    }

    // Se o nickname da rota for o do proprio usuario logado, trata como perfil proprio.
    if (nickname === this.user?.nickname) {
      return null;
    }

    // Qualquer outro nickname e um perfil de terceiro. Usa o mock quando existir
    // ou monta um perfil generico a partir dos posts do autor no feed.
    return this.publicProfileService.getProfileOrFallback(nickname, this.postService.getPosts());
  }
}

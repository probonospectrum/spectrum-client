import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { MockLoadingService } from '../../../core/services/loading/mock-loading.service';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import {
  PublicProfile,
  PublicProfileMockService,
} from '../../../core/services/profile/public-profile-mock.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';
import { AlertPopup, AlertPopupType } from '../../../shared/components/alert-popup/alert-popup';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

interface ProfileAlert {
  type: AlertPopupType;
  title: string;
  message: string;
}

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, SocialShell, PostCard, AlertPopup, ReportModal],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly publicProfileService = inject(PublicProfileMockService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockLoadingService = inject(MockLoadingService);

  readonly user: LoggedUser | null = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;

  reposts = this.postService.getUserReposts(this.user);
  activeTab: 'posts' | 'reposts' | 'saved' = 'posts';
  profileAlert = signal<ProfileAlert | null>(null);
  private readonly hiddenPostIds = new Set<string>();
  private readonly hiddenAuthorNicknames = new Set<string>();

  /** Perfil publico carregado quando a rota tem :nickname de outro usuario. */
  publicProfile = signal<PublicProfile | null>(null);

  /** true quando estamos vendo o perfil de outra pessoa (nao o proprio). */
  isOwnProfile = signal(true);
  profileLoading = signal(true);

  reportingProfile = false;
  reportMenuOpen = false;
  isFollowing = signal(false);

  /** Base de seguidores do perfil de terceiro, ajustada ao seguir/deixar de seguir. */
  private followersBase = signal(0);

  ngOnInit(): void {
    // Reage a mudancas do :nickname para reusar a mesma instancia do componente
    // ao navegar entre /perfil (proprio) e /perfil/:nickname (terceiro).
    this.route.paramMap
      .pipe(
        tap(() => this.profileLoading.set(true)),
        switchMap((params) =>
          this.mockLoadingService.load(() => this.resolvePublicProfile(params.get('nickname'))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profile) => this.applyProfile(profile));
  }

  private applyProfile(profile: PublicProfile | null): void {
    this.publicProfile.set(profile);
    this.isOwnProfile.set(profile === null);
    this.followersBase.set(profile?.followersCount ?? 0);

    // Reseta o estado de interacao ao trocar de perfil.
    this.isFollowing.set(false);
    this.reportingProfile = false;
    this.reportMenuOpen = false;
    this.activeTab = 'posts';
    this.profileLoading.set(false);
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
    const publicProfile = this.publicProfile();

    if (publicProfile) {
      return publicProfile.name;
    }
    return this.user?.name || 'Usuário Spectrum';
  }

  get nickname(): string {
    const publicProfile = this.publicProfile();

    if (publicProfile) {
      return publicProfile.nickname;
    }
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    const publicProfile = this.publicProfile();

    if (publicProfile) {
      return publicProfile.initial;
    }
    return this.displayName.charAt(0).toUpperCase();
  }

  get coverUrl(): string {
    return (
      this.publicProfile()?.coverUrl ||
      '/Background.png'
    );
  }

  get joinedDate(): string {
    return this.publicProfile()?.joinedDate || 'Janeiro de 2026';
  }

  get followingCount(): number {
    const publicProfile = this.publicProfile();

    if (publicProfile) {
      return publicProfile.followingCount;
    }
    return this.user?.following?.length ?? 48;
  }

  get followersCount(): number {
    if (this.publicProfile()) {
      return this.followersBase() + (this.isFollowing() ? 1 : 0);
    }
    return 72;
  }

  get userPosts(): SpectrumPost[] {
    const userNickname = this.nickname;

    if (this.publicProfile()) {
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
    if (!this.isOwnProfile()) {
      return [];
    }

    return this.postService.getUserSavedPosts(this.user);
  }

  get visibleSavedPosts(): SpectrumPost[] {
    if (!this.isOwnProfile()) {
      return [];
    }

    return this.savedPosts.filter(
      (post) =>
        !this.hiddenPostIds.has(post.id) && !this.hiddenAuthorNicknames.has(post.authorNickname),
    );
  }

  goToSettings(): void {
    void this.router.navigateByUrl('/configuracoes');
  }

  toggleFollow(): void {
    this.isFollowing.update((isFollowing) => !isFollowing);
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
      this.profileAlert.set({
        type: 'error',
        title: 'Nao foi possivel repostar',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    }
  }

  deletePost(post: SpectrumPost): void {
    try {
      this.postService.deletePost(post.id, this.user);
      this.reposts = this.postService.getUserReposts(this.user);
      this.profileAlert.set({
        type: 'success',
        title: 'Publicacao excluida',
        message: 'A publicacao foi removida.',
      });
    } catch (error) {
      this.profileAlert.set({
        type: 'error',
        title: 'Nao foi possivel excluir',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    }
  }

  hideAuthor(post: SpectrumPost): void {
    this.hiddenAuthorNicknames.add(post.authorNickname);
    this.profileAlert.set({
      type: 'success',
      title: 'Publicacoes ocultadas',
      message: `Voce nao vera mais publicacoes de @${post.authorNickname} nesta aba.`,
    });
  }

  hidePost(post: SpectrumPost): void {
    this.hiddenPostIds.add(post.id);
    this.profileAlert.set({
      type: 'success',
      title: 'Publicacao ocultada',
      message: 'A publicacao foi removida desta visualizacao.',
    });
  }

  reportPost(post: SpectrumPost, reason = 'Denunciar publicacao'): void {
    this.profileAlert.set({
      type: 'success',
      title: 'Denuncia enviada',
      message: `${reason}: ${post.content.slice(0, 72)}`,
    });
  }

  onPostUpdated(): void {
    this.reposts = this.postService.getUserReposts(this.user);
    this.profileAlert.set({
      type: 'success',
      title: 'Publicacao atualizada',
      message: 'As alteracoes foram salvas.',
    });
  }

  copyPostLink(post: SpectrumPost): void {
    const occurrenceId = post.originalPostId ?? post.id;
    const link = `${window.location.origin}/occurrences/${encodeURIComponent(occurrenceId)}`;

    void navigator.clipboard
      .writeText(link)
      .then(() => {
        this.profileAlert.set({
          type: 'success',
          title: 'Link copiado',
          message: 'O link da ocorrência foi copiado para a área de transferência.',
        });
      })
      .catch(() => {
        this.profileAlert.set({
          type: 'error',
          title: 'Nao foi possivel copiar',
          message: link,
        });
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

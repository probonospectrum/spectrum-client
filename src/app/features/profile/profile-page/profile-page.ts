import { FollowList } from '../../../shared/components/follow-list/follow-list';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, map, of, switchMap, tap } from 'rxjs';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { LoggedUser, PublicProfileResponse, UserService } from '../../../core/services/user/user.service';
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
  imports: [FollowList, TranslatePipe, UserAvatar, CommonModule, SocialShell, PostCard, AlertPopup, ReportModal],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user: LoggedUser | null = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;

  reposts = this.postService.getUserReposts(this.user);
  activeTab: 'posts' | 'reposts' | 'saved' = 'posts';
  profileAlert = signal<ProfileAlert | null>(null);
  private readonly hiddenPostIds = new Set<string>();
  private readonly hiddenAuthorNicknames = new Set<string>();

  /** Perfil publico carregado quando a rota tem :nickname de outro usuario. */
  publicProfile = signal<PublicProfileResponse | null>(null);
  profileError = signal('');
  private readonly authorPosts = signal<SpectrumPost[]>([]);
  readonly connections = signal<'followers' | 'following' | null>(null);
  readonly followSaving = signal(false);

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
        tap(() => { this.connections.set(null); this.profileLoading.set(true); this.profileError.set(''); this.authorPosts.set([]); }),
        switchMap((params) => this.loadProfile(params.get('nickname') ?? this.user?.nickname ?? '')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ profile, posts }) => { this.applyProfile(profile); this.authorPosts.set(posts); });
  }

  private loadProfile(nickname: string) {
    return this.userService.getPublicProfile(nickname).pipe(
      switchMap((profile) => (profile.canViewPosts ? this.postService.getAuthorPosts(profile, this.user) : of([])).pipe(
        map((posts) => ({ profile, posts })),
      )),
      catchError(() => { this.profileLoading.set(false); this.profileError.set('Não foi possível carregar este perfil.'); return EMPTY; }),
    );
  }

  private applyProfile(profile: PublicProfileResponse): void {
    this.publicProfile.set(profile);
    this.isOwnProfile.set(profile._id === this.user?._id);
    this.followersBase.set(profile?.followersCount ?? 0);

    // Reseta o estado de interacao ao trocar de perfil.
    this.isFollowing.set(profile.isFollowing);
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
      return publicProfile.name.charAt(0).toUpperCase();
    }
    return this.displayName.charAt(0).toUpperCase();
  }

  get coverUrl(): string {
    return (
      '/Background.png'
    );
  }

  get joinedDate(): string {
    const createdAt = this.publicProfile()?.createdAt;
    return createdAt ? new Intl.DateTimeFormat(this.i18n.language(), { month: 'long', year: 'numeric' }).format(new Date(createdAt)) : '';
  }

  get followingCount(): number {
    const publicProfile = this.publicProfile();

    if (publicProfile) {
      return publicProfile.followingCount;
    }
    return this.user?.following?.length ?? 0;
  }

  get followersCount(): number {
    if (this.publicProfile()) {
      return this.followersBase();
    }
    return 0;
  }

  get userPosts(): SpectrumPost[] {
    return this.authorPosts().filter((post) => !post.originalPostId);
  }

  get visibleReposts(): SpectrumPost[] {
    return this.authorPosts().filter((post) => Boolean(post.originalPostId)).filter(
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
    const target = this.publicProfile();
    if (!target || this.followSaving()) return;
    this.followSaving.set(true);
    this.userService.followUser(target._id, !this.isFollowing()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (this.publicProfile()?._id !== target._id) { this.followSaving.set(false); return; }
        this.refreshFollowCounts();
        this.isFollowing.set(response.isFollowing);
        this.followSaving.set(false);
      },
      error: () => { this.followSaving.set(false); this.profileAlert.set({ type: 'error', title: 'Não foi possível atualizar', message: 'A conta pode ser privada. Tente novamente.' }); },
    });
  }

  refreshFollowCounts(): void {
    const target = this.publicProfile();
    if (!target) return;
    this.userService.getPublicProfile(target.nickname).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: profile => {
        if (this.publicProfile()?._id !== target._id) return;
        this.publicProfile.set(profile); this.followersBase.set(profile.followersCount); this.isFollowing.set(profile.isFollowing);
      },
      error: () => this.profileAlert.set({ type: 'error', title: 'Atualização pendente', message: 'A ação foi salva, mas não foi possível atualizar os números. Recarregue o perfil.' }),
    });
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
    this.postService.toggleServerRepost(post, this.user).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.onPostUpdated(),
      error: () => this.profileAlert.set({ type: 'error', title: 'Não foi possível repostar', message: 'Tente novamente em instantes.' }),
    });
  }

  deletePost(post: SpectrumPost): void {
    this.postService.removeServerPost(post).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.onPostUpdated(),
      error: () => this.profileAlert.set({ type: 'error', title: 'Não foi possível excluir', message: 'Ocorrências preservam seu histórico. Apenas reposts próprios podem ser excluídos.' }),
    });
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
    this.loadProfile(this.nickname).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ profile, posts }) => { this.applyProfile(profile); this.authorPosts.set(posts); });
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

}

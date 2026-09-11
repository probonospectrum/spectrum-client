import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MockLoadingService } from '../../../core/services/loading/mock-loading.service';
import { LocationService } from '../../../core/services/location/location.service';
import { PostService, SpectrumPost, SuggestedProfile } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';
import { CreatePostModal } from '../create-post-modal/create-post-modal';
import { LogoutConfirm } from '../logout-confirm/logout-confirm';

interface SearchResult {
  id: string;
  name: string;
  type: 'Pessoa' | 'Cidade';
  nickname?: string;
  location?: string;
  slug?: string;
}

@Component({
  selector: 'app-social-shell',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    LogoutConfirm,
    CreatePostModal,
  ],
  templateUrl: './social-shell.html',
  styleUrl: './social-shell.scss',
})
export class SocialShell implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockLoadingService = inject(MockLoadingService);
  private readonly postService = inject(PostService);
  private readonly locationService = inject(LocationService);

  @Input() user: LoggedUser | null = null;
  @Input() suggestions: SuggestedProfile[] = [];
  @Input() title = 'Publicacoes';
  @Input() subtitle = 'Atualizacoes da comunidade';
  @Input() showContentHeader = true;
  @Output() logout = new EventEmitter<void>();
  @Output() createPost = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<SpectrumPost>();
  @Output() postUpdated = new EventEmitter<SpectrumPost>();

  // Confirmacao de logout
  isLogoutConfirmOpen = false;
  userMenuOpen = false;
  showCreatePost = false;
  editingPost: SpectrumPost | null = null;

  // PESQUISA 

  searchTerm = signal('');
  isSearching = signal(false);
  searchResults = signal<SearchResult[]>([]);
  searchSkeletons = [1, 2, 3, 4, 5];
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('criar') === '1') {
      this.openCreatePost();
    }
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  // MÉTODO DA PESQUISA
  onSearch(): void {

    this.cancelSearch();

    const term = this.searchTerm().trim();

    // Se apagou tudo
    if (!term) {
      this.isSearching.set(false);
      this.searchResults.set([]);
      return;
    }

    // Mostra os skeletons
    this.isSearching.set(true);
    this.searchResults.set([]);

    this.searchSubscription = this.mockLoadingService
      .load(() => this.getSearchResults(term))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });
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

  openCreatePost(): void {
    this.editingPost = null;
    this.showCreatePost = true;
    this.createPost.emit();
  }

  openEditPost(post: SpectrumPost): void {
    this.editingPost = post;
    this.showCreatePost = true;
  }

  closeCreatePost(): void {
    this.showCreatePost = false;
    this.editingPost = null;

    if (this.route.snapshot.queryParamMap.has('criar')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { criar: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  handlePostCreated(post: SpectrumPost): void {
    this.closeCreatePost();
    this.postCreated.emit(post);
  }

  handlePostUpdated(post: SpectrumPost): void {
    this.closeCreatePost();
    this.postUpdated.emit(post);
  }

  handleCreatePost(): void {
    this.openCreatePost();
  }

  goToProfile(nickname: string): void {
    const normalizedNickname = nickname.trim();

    if (!normalizedNickname) {
      return;
    }

    this.closeSearch();
    void this.router.navigate(['/perfil', normalizedNickname]);
  }

  goToCity(slug: string): void {
    const normalizedSlug = slug.trim();

    if (!normalizedSlug) {
      return;
    }

    this.closeSearch();
    void this.router.navigate(['/cidades', normalizedSlug]);
  }

  selectSearchResult(result: SearchResult): void {
    if (result.type === 'Pessoa' && result.nickname) {
      this.goToProfile(result.nickname);
      return;
    }

    if (result.type === 'Cidade' && result.slug) {
      this.goToCity(result.slug);
    }
  }

  openLogoutConfirm(): void {
    this.userMenuOpen = false;
    this.isLogoutConfirmOpen = true;
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  cancelLogout(): void {
    this.isLogoutConfirmOpen = false;
  }

  confirmLogout(): void {
    this.isLogoutConfirmOpen = false;
    this.logout.emit();
  }

  closeSearch(): void {
    this.cancelSearch();

    this.searchTerm.set('');
    this.isSearching.set(false);
    this.searchResults.set([]);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSearch();
    }
  }

  private getSearchResults(term: string): SearchResult[] {
    const normalizedTerm = this.locationService.normalize(term);
    const profileResults = this.getProfileSearchResults().filter((result) =>
      [result.name, result.nickname || '', result.type]
        .map((value) => this.locationService.normalize(value))
        .some((value) => value.includes(normalizedTerm)),
    );
    const cityResults = this.locationService.searchLocations(term).map<SearchResult>((location) => ({
      id: `city:${location.id}`,
      name: location.name,
      type: 'Cidade',
      location: `${location.state}, ${location.country}`,
      slug: location.slug,
    }));

    return [...profileResults, ...cityResults];
  }

  private cancelSearch(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubscription = undefined;
  }

  private getProfileSearchResults(): SearchResult[] {
    const results = new Map<string, SearchResult>();

    for (const profile of this.suggestions) {
      results.set(profile.nickname, {
        id: `profile:${profile.nickname}`,
        name: profile.name,
        type: 'Pessoa',
        nickname: profile.nickname,
      });
    }

    for (const post of this.postService.getPosts(this.user)) {
      if (!results.has(post.authorNickname)) {
        results.set(post.authorNickname, {
          id: `profile:${post.authorNickname}`,
          name: post.authorName,
          type: 'Pessoa',
          nickname: post.authorNickname,
        });
      }
    }

    return [...results.values()];
  }
}

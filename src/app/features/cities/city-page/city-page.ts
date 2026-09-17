import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { MockLoadingService } from '../../../core/services/loading/mock-loading.service';
import { LocationService, SpectrumLocation } from '../../../core/services/location/location.service';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { LoadingIndicator } from '../../../shared/components/loading-indicator/loading-indicator';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

@Component({
  selector: 'app-city-page',
  imports: [CommonModule, SocialShell, PostCard, LoadingIndicator],
  templateUrl: './city-page.html',
  styleUrl: './city-page.scss',
})
export class CityPage implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockLoadingService = inject(MockLoadingService);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;

  location = signal<SpectrumLocation | null>(null);
  cityLoading = signal(true);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => this.cityLoading.set(true)),
        switchMap((params) =>
          this.mockLoadingService.load(() => this.locationService.findBySlug(params.get('slug') || '')),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((location) => {
        this.location.set(location);
        this.cityLoading.set(false);
      });
  }

  get cityTitle(): string {
    return this.location()?.name || 'Cidade nao encontrada';
  }

  get citySubtitle(): string {
    const location = this.location();
    return location ? `${location.state} - ${location.country}` : 'Resultado de pesquisa';
  }

  get posts(): SpectrumPost[] {
    const location = this.location();

    if (!location) {
      return [];
    }

    const cityName = this.locationService.normalize(location.city);

    return this.postService
      .getPosts(this.user)
      .filter((post) => this.locationService.normalize(post.authorCity).includes(cityName));
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  toggleRepost(post: SpectrumPost): void {
    this.postService.toggleRepost(post, this.user);
  }
}

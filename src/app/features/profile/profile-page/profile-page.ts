import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

@Component({
  selector: 'app-profile-page',
  imports: [SocialShell, PostCard, ReportModal],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user: LoggedUser | null = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;

  activeTab: 'posts' | 'shares' = 'posts';
  reportingProfile = false;
  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  goToSavedPosts(): void {
    this.menuOpen = false;
    this.router.navigate(['/perfil/salvos']);
  }

  openReport(): void {
    this.menuOpen = false;
    this.reportingProfile = true; 
  }

  get displayName(): string {
    return this.user?.name || 'Usuário Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  get joinedDate(): string {
    return 'Janeiro de 2027';
  }

  get followingCount(): number {
    return this.user?.following?.length ?? 250;
  }

  get followersCount(): number {
    return 350;
  }

  get userPosts(): SpectrumPost[] {
    if (this.activeTab === 'posts') {
      const allPosts = this.postService.getPosts();
      const userNickname = this.nickname;
      return allPosts.filter((p) => p.authorNickname === userNickname);
    }
    return [];
  }

  goToSettings(): void {
    void this.router.navigateByUrl('/configuracoes');
  }

  confirmReport(): void {
    this.reportingProfile = false;
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

@Component({
  selector: 'app-posts-page',
  imports: [CommonModule, RouterLink, SocialShell, PostCard, ReportModal],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.scss',
})
export class PostsPage {
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  posts = this.postService.getPosts();
  reportPost: SpectrumPost | null = null;

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  openReport(post: SpectrumPost): void {
    this.reportPost = post;
  }

  confirmReport(): void {
    this.reportPost = null;
  }
}

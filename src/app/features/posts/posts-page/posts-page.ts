import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

@Component({
  selector: 'app-posts-page',
  imports: [CommonModule, RouterLink, SocialShell, PostCard],
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
  selectedReason = 'Discurso de odio';

  readonly reportReasons = [
    'Discurso de odio',
    'Abuso ou assedio',
    'Conteudo sexual',
    'Seguranca infantil',
  ];

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.reportPost = null;
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  openReport(post: SpectrumPost): void {
    this.reportPost = post;
    this.selectedReason = this.reportReasons[0];
  }

  confirmReport(): void {
    this.reportPost = null;
  }
}

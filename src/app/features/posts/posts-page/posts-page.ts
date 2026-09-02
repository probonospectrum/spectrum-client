import { CommonModule } from '@angular/common';
import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-posts-page',
  imports: [CommonModule, FormsModule, RouterLink, SocialShell, PostCard, ReportModal],
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
  showCreatePost = false;
  newPostContent = '';
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
    this.closeCreatePost();
  }

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

  // Adicionando os dados do usuário
  get displayName(): string {
    return this.user?.name || 'Usuario Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }
  
  // Funções para a abrir e fechar o modal de criação do post
  openCreatePost(): void {
    this.showCreatePost = true;
  }

  closeCreatePost(): void {
    this.showCreatePost = false;
    this.newPostContent = '';
  }

// Processo simples de publicação/criação do post (sem API)
  publishPost(): void {
    const content = this.newPostContent.trim();

    if (!content) {
      return;
    }

    console.log('Publicação criada:', content);

    this.closeCreatePost();
  }

}

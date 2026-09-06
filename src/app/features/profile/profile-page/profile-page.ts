import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
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
export class ProfilePage {
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user: LoggedUser | null = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  reposts = this.postService.getUserReposts(this.user);
  activeTab: 'posts' | 'reposts' | 'saved' = 'posts';
  profileAlert: ProfileAlert | null = null;
  private readonly hiddenPostIds = new Set<string>();
  private readonly hiddenAuthorNicknames = new Set<string>();

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
    const allPosts = this.postService.getPosts(this.user);
    return allPosts.filter((post) => post.authorNickname === this.nickname);
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
}

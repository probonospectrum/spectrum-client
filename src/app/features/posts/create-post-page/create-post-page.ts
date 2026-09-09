import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { AlertPopup, AlertPopupType } from '../../../shared/components/alert-popup/alert-popup';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

interface PostAlert {
  type: AlertPopupType;
  title: string;
  message: string;
  resultPost?: SpectrumPost;
}

@Component({
  selector: 'app-create-post-page',
  imports: [CommonModule, FormsModule, RouterLink, AlertPopup, SocialShell],
  templateUrl: './create-post-page.html',
  styleUrl: './create-post-page.scss',
})
export class CreatePostPage {
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  readonly mediaTypes: Array<{ label: string; value: SpectrumPost['mediaType'] }> = [
    { label: 'Video', value: 'video' },
    { label: 'Imagem', value: 'image' },
    { label: 'Texto', value: 'text' },
  ];

  content = '';
  authorCity = this.user?.cityUser ?? '';
  tagText = '';
  mediaType: SpectrumPost['mediaType'] = 'video';
  alert: PostAlert | null = null;

  get displayName(): string {
    return this.user?.name || 'Usuario Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  submitPost(): void {
    const content = this.content.trim();
    const authorCity = this.authorCity.trim();

    if (!content || !authorCity) {
      this.alert = {
        type: 'error',
        title: 'Nao foi possivel publicar',
        message: 'Preencha conteudo e localizacao para continuar.',
      };
      return;
    }

    const payload = {
      title: this.getPostTitle(content),
      content,
      authorCity,
      mediaType: this.mediaType,
      tags: this.parseTags(),
    };

    const createdPost = this.postService.createPost(payload, this.user);

    this.alert = {
      type: 'success',
      title: 'Publicacao criada',
      message: 'Sua publicacao foi salva e ja aparece no feed.',
      resultPost: createdPost,
    };
  }

  dismissAlert(): void {
    const resultPost = this.alert?.resultPost;
    this.alert = null;

    if (resultPost) {
      void this.router.navigateByUrl('/publicacoes');
    }
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  private parseTags(): string[] {
    return this.tagText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  private getPostTitle(content: string): string {
    return content.length > 72 ? `${content.slice(0, 69)}...` : content;
  }

}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  readonly editPostId = this.route.snapshot.paramMap.get('id');
  readonly editPost = this.editPostId ? this.postService.findPostById(this.editPostId, this.user) : null;
  readonly isEditing = Boolean(this.editPostId);
  readonly mediaTypes: Array<{ label: string; value: SpectrumPost['mediaType'] }> = [
    { label: 'Video', value: 'video' },
    { label: 'Imagem', value: 'image' },
    { label: 'Texto', value: 'text' },
  ];

  title = this.editPost?.title ?? '';
  content = this.editPost?.content ?? '';
  authorCity = this.editPost?.authorCity ?? this.user?.cityUser ?? '';
  tagText = this.editPost?.tags.join(', ') ?? '';
  mediaType: SpectrumPost['mediaType'] = this.editPost?.mediaType ?? 'video';
  alert: PostAlert | null = this.getInitialAlert();

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
    const title = this.title.trim();
    const content = this.content.trim();
    const authorCity = this.authorCity.trim();

    if (!title || !content || !authorCity) {
      this.alert = {
        type: 'error',
        title: this.isEditing ? 'Nao foi possivel salvar' : 'Nao foi possivel publicar',
        message: 'Preencha titulo, conteudo e localizacao para continuar.',
      };
      return;
    }

    const payload = {
      title,
      content,
      authorCity,
      mediaType: this.mediaType,
      tags: this.parseTags(),
    };

    if (this.isEditing) {
      this.updatePost(payload);
      return;
    }

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

  private updatePost(payload: {
    title: string;
    content: string;
    authorCity: string;
    mediaType: SpectrumPost['mediaType'];
    tags: string[];
  }): void {
    if (!this.editPostId || !this.editPost) {
      this.alert = {
        type: 'error',
        title: 'Publicacao nao encontrada',
        message: 'Volte ao feed e tente abrir a edicao novamente.',
      };
      return;
    }

    try {
      const updatedPost = this.postService.updatePost(this.editPostId, payload, this.user);
      this.alert = {
        type: 'success',
        title: 'Publicacao atualizada',
        message: 'As alteracoes foram salvas e ja aparecem no feed.',
        resultPost: updatedPost,
      };
    } catch (error) {
      this.alert = {
        type: 'error',
        title: 'Nao foi possivel salvar',
        message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      };
    }
  }

  private getInitialAlert(): PostAlert | null {
    if (!this.isEditing) {
      return null;
    }

    if (!this.editPost) {
      return {
        type: 'error',
        title: 'Publicacao nao encontrada',
        message: 'Nao encontramos esta publicacao para edicao.',
      };
    }

    if (!this.postService.canModifyPost(this.editPost, this.user)) {
      return {
        type: 'error',
        title: 'Prazo de edicao expirado',
        message: 'Edicoes ficam disponiveis somente nos primeiros 15 minutos apos a criacao.',
      };
    }

    return null;
  }
}

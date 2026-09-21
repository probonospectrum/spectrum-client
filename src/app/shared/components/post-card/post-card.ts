import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommentSection } from '../../../features/posts/comment-section/comment-section';
import {
  POST_EDIT_WINDOW_MS,
  PostService,
  SpectrumPost,
} from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-post-card',
  imports: [CommonModule, CommentSection],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCard implements OnChanges, OnDestroy {
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);

  @Input({ required: true }) post!: SpectrumPost;
  @Input() currentUser: LoggedUser | null = null;
  @Output() report = new EventEmitter<SpectrumPost>();
  @Output() edit = new EventEmitter<SpectrumPost>();
  @Output() remove = new EventEmitter<SpectrumPost>();
  @Output() repost = new EventEmitter<SpectrumPost>();
  @Output() hideAuthor = new EventEmitter<SpectrumPost>();
  @Output() notInterested = new EventEmitter<SpectrumPost>();
  @Output() aiSpam = new EventEmitter<SpectrumPost>();
  @Output() copyLink = new EventEmitter<SpectrumPost>();

  commentsOpen = false;
  addedCommentsCount = 0;
  menuOpen = false;
  now = Date.now();

  private editWindowTimer: ReturnType<typeof setInterval> | null = null;

  get likes(): number {
    return this.post.likes;
  }

  get commentsCount(): number {
    return this.post.comments + this.addedCommentsCount;
  }

  get reposts(): number {
    return this.post.reposts;
  }

  get isSaved(): boolean {
    return this.post.saved;
  }

  get statusLabel(): string {
    return this.postService.getStatusLabel(this.post.status);
  }

  get importanceLabel(): string {
    return this.postService.getImportanceLabel(this.post.importance);
  }

  get categoryLabel(): string {
    return this.postService.getCategoryLabel(this.post.category);
  }

  get latestHistory() {
    return [...this.post.history]
      .sort(
        (first, second) =>
          new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime(),
      )
      .slice(0, 3);
  }

  get historyCount(): number {
    return this.post.history.length;
  }

  get responsibleAgencyLabel(): string {
    return this.post.responsibleAgency?.name || 'Orgao ainda nao identificado';
  }

  get isOwnPost(): boolean {
    if (!this.currentUser) {
      return false;
    }

    return (
      this.post.createdBy === this.currentUser._id ||
      this.post.authorNickname === this.currentUser.nickname
    );
  }

  get canModifyOwnPost(): boolean {
    const createdAt = new Date(this.post.createdAt || this.post.publishedAt).getTime();

    if (!this.isOwnPost || !Number.isFinite(createdAt)) {
      return false;
    }

    return this.now - createdAt <= POST_EDIT_WINDOW_MS;
  }

  get editWindowStatus(): string {
    return this.canModifyOwnPost ? 'Disponivel por 15 min' : 'Prazo expirado';
  }

  ngOnChanges(): void {
    this.configureEditWindowTimer();
  }

  ngOnDestroy(): void {
    this.clearEditWindowTimer();
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleLike(): void {
    const previousPost = this.post;
    this.post = {
      ...this.post,
      liked: !this.post.liked,
      likes: Math.max(0, this.post.likes + (this.post.liked ? -1 : 1)),
    };

    try {
      this.post = this.postService.togglePostLike(previousPost, this.currentUser);
    } catch {
      this.post = previousPost;
    }
  }

  toggleSaved(): void {
    const previousPost = this.post;
    this.post = {
      ...this.post,
      saved: !this.post.saved,
    };

    try {
      this.post = this.postService.togglePostSaved(previousPost, this.currentUser);
    } catch {
      this.post = previousPost;
    }
  }

  toggleComments(): void {
    this.commentsOpen = !this.commentsOpen;
  }

  goToAuthorProfile(): void {
    if (!this.post.authorNickname) {
      return;
    }

    void this.router.navigate(['/perfil', this.post.authorNickname]);
  }

  goToOccurrence(): void {
    if (!this.canOpenOccurrence) return;
    void this.router.navigate(['/ocorrencias', this.post.originalPostId ?? this.post.id]);
  }

  get canOpenOccurrence(): boolean {
    return /^[a-f\d]{24}$/i.test(this.post.originalPostId ?? this.post.id);
  }

  onCommentAdded(): void {
    this.addedCommentsCount++;
  }

  formatHistoryEvent(eventType: string): string {
    const labels: Record<string, string> = {
      OCORRENCIA_CRIADA: 'Ocorrencia criada',
      OCCURRENCE_UPDATED: 'Ocorrencia atualizada',
      COMMENT_ADDED: 'Comentario adicionado',
      COMMENT_EDITED: 'Comentario editado',
      COMMENT_REMOVED: 'Comentario removido',
      EVIDENCIA_ADICIONADA: 'Evidencia adicionada',
      OCORRENCIA_CONFIRMADA: 'Tambem identificado',
      ORGAO_RESPONSAVEL_IDENTIFICADO: 'Orgao identificado',
      AGENCY_NOT_IDENTIFIED: 'Sem orgao identificado',
      OCORRENCIA_ENCAMINHADA: 'Encaminhamento registrado',
      ENCAMINHAMENTO_FALHOU: 'Encaminhamento falhou',
      FORWARDING_RESPONSE_REGISTERED: 'Resposta registrada',
      PROTOCOL_REGISTERED: 'Protocolo recebido',
      ANALISE_INICIADA: 'Analise iniciada',
      RESOLUCAO_INFORMADA: 'Resolucao informada',
      OCORRENCIA_RESOLVIDA: 'Resolucao confirmada',
      RESOLUCAO_CONTESTADA: 'Resolucao contestada',
      OCORRENCIA_REABERTA: 'Ocorrencia reaberta',
      MODERATION_APPLIED: 'Moderacao registrada',
    };

    return labels[eventType] ?? eventType;
  }

  formatHistoryDate(date: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  selectMenuAction(action: EventEmitter<SpectrumPost>): void {
    action.emit(this.post);
    this.menuOpen = false;
  }

  selectModifyAction(action: EventEmitter<SpectrumPost>): void {
    if (!this.canModifyOwnPost) {
      return;
    }

    this.selectMenuAction(action);
  }

  private configureEditWindowTimer(): void {
    this.clearEditWindowTimer();
    this.now = Date.now();

    if (!this.isOwnPost || !this.canModifyOwnPost) {
      return;
    }

    this.editWindowTimer = setInterval(() => {
      this.now = Date.now();

      if (!this.canModifyOwnPost) {
        this.clearEditWindowTimer();
      }
    }, 1000);
  }

  private clearEditWindowTimer(): void {
    if (!this.editWindowTimer) {
      return;
    }

    clearInterval(this.editWindowTimer);
    this.editWindowTimer = null;
  }
}

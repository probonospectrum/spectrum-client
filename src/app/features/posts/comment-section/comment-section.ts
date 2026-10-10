import { LocalizedDatePipe, TranslatePipe } from '../../../core/i18n/translate.pipe';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, Injector, afterNextRender, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostService, SpectrumComment } from '../../../core/services/posts/post.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-comment-section',
  imports: [LocalizedDatePipe, TranslatePipe, ReportModal, UserAvatar, CommonModule, FormsModule],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.scss',
})
export class CommentSection implements OnInit {
  @Input({ required: true }) postId!: string;
  @Input() currentUser: LoggedUser | null = null;
  @Output() commentAdded = new EventEmitter<void>();

  readonly visibleCount = 2;

  comments: SpectrumComment[] = [];
  showAll = false;
  newComment = '';
  loading = false;
  saving = false;
  error = '';
  menuCommentId: string | null = null;
  reportTarget: SpectrumComment | null = null;
  deleteTarget: SpectrumComment | null = null;
  actionPending = false;
  actionMessage = '';
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor(
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.postService.loadComments(this.postId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.loading = false;
        const target = comments.find(comment => window.location.hash === '#comment-' + comment.id);
        if (target) {
          this.showAll = true;
          afterNextRender(() => document.getElementById('comment-' + target.id)?.scrollIntoView({ block: 'center' }),
            { injector: this.injector });
        }
      },
      error: () => { this.error = 'Não foi possível carregar os comentários.'; this.loading = false; },
    });
  }

  get visibleComments(): SpectrumComment[] {
    return this.showAll ? this.comments : this.comments.slice(0, this.visibleCount);
  }

  get hasMoreComments(): boolean {
    return this.comments.length > this.visibleCount;
  }

  get remainingCount(): number {
    return this.comments.length - this.visibleCount;
  }

  get displayName(): string {
    return this.userService.getCurrentUser()?.name || 'Usuario Spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  addComment(): void {
    const content = this.newComment.trim();
    const user = this.currentUser ?? this.userService.getCurrentUser();
    if (!content || !user || this.saving) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.postService.createComment(this.postId, content, user).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (comment) => { this.comments = [comment, ...this.comments]; this.newComment = ''; this.saving = false; this.commentAdded.emit(); },
      error: () => { this.saving = false; this.error = 'Não foi possível enviar o comentário. Tente novamente.'; },
    });
  }

  isLiked(commentId: string): boolean {
    return this.findComment(commentId)?.liked ?? false;
  }

  isDisliked(commentId: string): boolean {
    return this.findComment(commentId)?.disliked ?? false;
  }

  likeCount(commentId: string): number {
    return this.findComment(commentId)?.likes ?? 0;
  }

  dislikeCount(commentId: string): number {
    return this.findComment(commentId)?.dislikes ?? 0;
  }

  toggleLike(commentId: string): void {
    const comment = this.findComment(commentId);

    if (!comment) {
      return;
    }

    const previousComment = comment;
    const nextLiked = !comment.liked;
    const optimisticComment: SpectrumComment = {
      ...comment,
      liked: nextLiked,
      disliked: nextLiked ? false : comment.disliked,
      likes: comment.likes + (nextLiked ? 1 : -1),
      dislikes: comment.disliked && nextLiked ? comment.dislikes - 1 : comment.dislikes,
    };

    this.replaceComment(optimisticComment);

    try {
      this.replaceComment(this.postService.toggleCommentLike(previousComment, this.currentUser));
    } catch {
      this.replaceComment(previousComment);
    }
  }

  toggleDislike(commentId: string): void {
    const comment = this.findComment(commentId);

    if (!comment) {
      return;
    }

    const previousComment = comment;
    const nextDisliked = !comment.disliked;
    const optimisticComment: SpectrumComment = {
      ...comment,
      disliked: nextDisliked,
      liked: nextDisliked ? false : comment.liked,
      dislikes: comment.dislikes + (nextDisliked ? 1 : -1),
      likes: comment.liked && nextDisliked ? comment.likes - 1 : comment.likes,
    };

    this.replaceComment(optimisticComment);

    try {
      this.replaceComment(this.postService.toggleCommentDislike(previousComment, this.currentUser));
    } catch {
      this.replaceComment(previousComment);
    }
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeMenu(): void { this.menuCommentId = null; }

  toggleMenu(commentId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.menuCommentId = this.menuCommentId === commentId ? null : commentId;
  }

  isOwnComment(comment: SpectrumComment): boolean {
    const user = this.currentUser ?? this.userService.getCurrentUser();
    return !!user && comment.authorId === user._id;
  }

  async copyCommentLink(comment: SpectrumComment): Promise<void> {
    this.closeMenu();
    this.error = '';
    this.actionMessage = '';
    try {
      await navigator.clipboard.writeText(window.location.origin + '/occurrences/' +
        encodeURIComponent(this.postId) + '#comment-' + encodeURIComponent(comment.id));
      this.actionMessage = 'Link do comentário copiado.';
    } catch { this.error = 'Não foi possível copiar o link. Tente novamente.'; }
  }

  reportComment(comment: SpectrumComment): void {
    this.closeMenu();
    this.reportTarget = comment;
  }

  requestDelete(comment: SpectrumComment): void {
    this.closeMenu();
    if (this.isOwnComment(comment)) this.deleteTarget = comment;
  }

  confirmDelete(): void {
    const target = this.deleteTarget;
    if (!target || !this.isOwnComment(target) || this.actionPending) return;
    this.actionPending = true;
    this.error = '';
    this.actionMessage = '';
    this.postService.deleteComment(target.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.comments = this.comments.filter(comment => comment.id !== target.id);
        this.actionPending = false;
        this.deleteTarget = null;
        this.actionMessage = 'Comentário excluído.';
      },
      error: () => {
        this.actionPending = false;
        this.error = 'Não foi possível excluir o comentário. Tente novamente.';
      },
    });
  }

  private findComment(commentId: string): SpectrumComment | undefined {
    return this.comments.find((comment) => comment.id === commentId);
  }

  private replaceComment(updatedComment: SpectrumComment): void {
    this.comments = this.comments.map((comment) =>
      comment.id === updatedComment.id ? updatedComment : comment,
    );
  }
}

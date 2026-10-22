import { LocalizedDatePipe, TranslatePipe } from '../../../core/i18n/translate.pipe';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, DestroyRef, Injector, afterNextRender, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, TemplateRef, ViewChild, inject } from '@angular/core';
import { SettingsDialog } from '../../../shared/components/settings-dialog/settings-dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PostService, SpectrumComment } from '../../../core/services/posts/post.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-comment-section',
  imports: [SettingsDialog, LocalizedDatePipe, TranslatePipe, ReportModal, UserAvatar, CommonModule, FormsModule],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.scss',
})
export class CommentSection implements OnInit {
  @Input({ required: true }) postId!: string;
  @Input() currentUser: LoggedUser | null = null;
  @Input() responsibleAgencyId?: string;
  replyTarget: SpectrumComment | null = null;
  replyText = '';
  replyHelpId: string | null = null;
  dismissedReplyHelpId: string | null = null;
  @ViewChild('replyInput') replyInput?: ElementRef<HTMLInputElement>;

  get canOfficialReply(): boolean {
    return this.currentUser?.occurrenceRole === 'MODERATOR' ||
      (this.currentUser?.occurrenceRole === 'RESPONSIBLE_AGENCY' &&
        this.currentUser.agencyRegistrationStatus === 'APPROVED' &&
        !!this.responsibleAgencyId &&
        this.currentUser.occurrenceAgencyId === this.responsibleAgencyId);
  }

  get replyLabel(): string {
    return this.currentUser?.occurrenceRole === 'MODERATOR'
      ? 'Responder como Spectrum'
      : 'Responder como órgão público';
  }

  get replyRestriction(): string {
    if (this.canOfficialReply) return '';
    if (this.currentUser?.accountType === 'PUBLIC_AGENCY' ||
      this.currentUser?.occurrenceRole === 'RESPONSIBLE_AGENCY') {
      return 'Para responder, sua conta deve estar aprovada, com vínculo institucional ativo, e representar o órgão responsável por esta ocorrência.';
    }
    return 'Somente o órgão responsável pela ocorrência e a comunicação do Spectrum podem responder aos comentários.';
  }

  startReply(comment: SpectrumComment): void {
    if (this.saving || comment.parentCommentId) return;
    if (!this.canOfficialReply) {
      this.dismissedReplyHelpId = null;
      this.replyHelpId = comment.id;
      return;
    }
    this.replyHelpId = null;
    if (this.replyTarget?.id !== comment.id) this.replyText = '';
    this.replyTarget = comment;
    this.showAll = true;
    afterNextRender(() => this.replyInput?.nativeElement.focus(), { injector: this.injector });
  }

  closeReplyHelp(commentId: string, trigger: HTMLButtonElement): void {
    this.replyHelpId = null;
    trigger.focus();
    this.dismissedReplyHelpId = commentId;
  }

  cancelReply(): void {
    if (this.saving) return;
    this.replyTarget = null;
    this.replyText = '';
  }

  isReply(comment: SpectrumComment): boolean {
    return !!comment.parentCommentId && this.comments.some(parent => parent.id === comment.parentCommentId);
  }

  @Input() renderDialogs = true;
  @ViewChild('dialogs', { static: true }) dialogs!: TemplateRef<unknown>;
  @Output() commentAdded = new EventEmitter<void>();
  @Output() commentCountChanged = new EventEmitter<number>();

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
  private readonly pendingReactions = new Set<string>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
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
        this.commentCountChanged.emit(this.comments.length);
        this.changeDetector.markForCheck();
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

  private get commentThreads(): SpectrumComment[][] {
    const byId = new Map(this.comments.map(comment => [comment.id, comment]));
    const children = new Map<string, SpectrumComment[]>();
    for (const comment of this.comments) {
      if (comment.parentCommentId && byId.has(comment.parentCommentId)) {
        const siblings = children.get(comment.parentCommentId) ?? [];
        siblings.push(comment);
        children.set(comment.parentCommentId, siblings);
      }
    }
    const visited = new Set<string>();
    const threads: SpectrumComment[][] = [];
    const append = (comment: SpectrumComment, thread: SpectrumComment[]) => {
      if (visited.has(comment.id)) return;
      visited.add(comment.id);
      thread.push(comment);
      const replies = children.get(comment.id) ?? [];
      for (const reply of [...replies].sort((a, b) =>
        (a.createdAt ?? a.id).localeCompare(b.createdAt ?? b.id))) append(reply, thread);
    };
    const roots = this.comments.filter(comment => !comment.parentCommentId || !byId.has(comment.parentCommentId));
    for (const comment of [...roots, ...this.comments]) {
      if (visited.has(comment.id)) continue;
      const thread: SpectrumComment[] = [];
      append(comment, thread);
      threads.push(thread);
    }
    return threads;
  }

  get visibleComments(): SpectrumComment[] {
    const threads = this.commentThreads;
    return (this.showAll ? threads : threads.slice(0, this.visibleCount)).flat();
  }

  get hasMoreComments(): boolean {
    return this.commentThreads.length > this.visibleCount;
  }

  get remainingCount(): number {
    return this.commentThreads.length - this.visibleCount;
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
    this.submitComment(this.newComment.trim());
  }

  addReply(): void {
    if (!this.replyTarget) return;
    if (!this.canOfficialReply) {
      this.replyHelpId = this.replyTarget.id;
      return;
    }
    this.submitComment(this.replyText.trim(), this.replyTarget.id);
  }

  private submitComment(content: string, parentCommentId?: string): void {
    const user = this.currentUser ?? this.userService.getCurrentUser();
    if (!content || !user || this.saving) return;
    this.saving = true;
    this.error = '';
    this.postService.createComment(this.postId, content, user, parentCommentId)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (comment) => {
          this.comments = parentCommentId ? [...this.comments, comment] : [comment, ...this.comments];
          if (parentCommentId) {
            this.replyText = '';
            this.replyTarget = null;
          } else this.newComment = '';
          this.saving = false;
          this.commentAdded.emit();
          this.commentCountChanged.emit(this.comments.length);
          this.changeDetector.markForCheck();
        },
        error: (error) => {
          this.saving = false;
          this.error = typeof error.error?.message === 'string'
            ? error.error.message
            : 'Não foi possível enviar o comentário. Tente novamente.';
          this.changeDetector.markForCheck();
        },
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
    if (!this.currentUser || this.pendingReactions.has(commentId)) return;
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

    this.saveReaction(previousComment, nextLiked ? 'LIKE' : null);
  }

  toggleDislike(commentId: string): void {
    if (!this.currentUser || this.pendingReactions.has(commentId)) return;
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

    this.saveReaction(previousComment, nextDisliked ? 'UNLIKE' : null);
  }

  private saveReaction(previous: SpectrumComment, reaction: 'LIKE' | 'UNLIKE' | null): void {
    this.pendingReactions.add(previous.id);
    this.postService.setCommentReaction(previous, reaction).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: comment => { this.replaceComment(comment); this.pendingReactions.delete(previous.id); this.changeDetector.markForCheck(); },
      error: () => {
        this.replaceComment(previous);
        this.pendingReactions.delete(previous.id);
        this.error = 'Não foi possível salvar a reação. Tente novamente.';
        this.changeDetector.markForCheck();
      },
    });
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
        if (this.replyTarget?.id === target.id) this.cancelReply();
        this.commentCountChanged.emit(this.comments.length);
        this.changeDetector.markForCheck();
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

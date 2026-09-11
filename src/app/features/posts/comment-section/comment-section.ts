import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { PostService, SpectrumComment } from '../../../core/services/posts/post.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';
import { ReportModal } from '../../../shared/components/report-modal/report-modal';

@Component({
  selector: 'app-comment-section',
  imports: [CommonModule, FormsModule, ReportModal],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.scss',
})
export class CommentSection implements OnInit {
  @Input({ required: true }) postId!: string;
  @Output() commentAdded = new EventEmitter<void>();

  readonly visibleCount = 2;

  comments: SpectrumComment[] = [];
  showAll = false;
  newComment = '';
  openMenuCommentId: string | null = null;
  reportingCommentId: string | null = null;

  private likedIds = new Set<string>();
  private dislikedIds = new Set<string>();
  private savedIds = new Set<string>();
  private likeCounts = new Map<string, number>();
  private dislikeCounts = new Map<string, number>();

  constructor(
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.comments = this.postService.getComments(this.postId);
    this.comments.forEach((comment) => {
      this.likeCounts.set(comment.id, 0);
      this.dislikeCounts.set(comment.id, 0);
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

  @HostListener('document:click')
  closeMenu(): void {
    this.openMenuCommentId = null;
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  addComment(): void {
    const content = this.newComment.trim();
    if (!content) {
      return;
    }

    const newId = `local-${Date.now()}`;
    this.comments = [
      {
        id: newId,
        authorName: this.displayName,
        authorInitial: this.userInitial,
        content,
        dateLabel: 'Agora',
      },
      ...this.comments,
    ];
    this.likeCounts.set(newId, 0);
    this.dislikeCounts.set(newId, 0);
    this.newComment = '';
    this.commentAdded.emit();
  }

  isLiked(commentId: string): boolean {
    return this.likedIds.has(commentId);
  }

  isDisliked(commentId: string): boolean {
    return this.dislikedIds.has(commentId);
  }

  isSaved(commentId: string): boolean {
    return this.savedIds.has(commentId);
  }

  likeCount(commentId: string): number {
    return this.likeCounts.get(commentId) ?? 0;
  }

  dislikeCount(commentId: string): number {
    return this.dislikeCounts.get(commentId) ?? 0;
  }

  toggleLike(commentId: string): void {
    if (this.likedIds.has(commentId)) {
      this.likedIds.delete(commentId);
      this.likeCounts.set(commentId, this.likeCount(commentId) - 1);
      return;
    }

    this.likedIds.add(commentId);
    this.likeCounts.set(commentId, this.likeCount(commentId) + 1);

    if (this.dislikedIds.has(commentId)) {
      this.dislikedIds.delete(commentId);
      this.dislikeCounts.set(commentId, this.dislikeCount(commentId) - 1);
    }
  }

  toggleDislike(commentId: string): void {
    if (this.dislikedIds.has(commentId)) {
      this.dislikedIds.delete(commentId);
      this.dislikeCounts.set(commentId, this.dislikeCount(commentId) - 1);
      return;
    }

    this.dislikedIds.add(commentId);
    this.dislikeCounts.set(commentId, this.dislikeCount(commentId) + 1);

  toggleCommentMenu(event: MouseEvent, commentId: string): void {
    event.stopPropagation();
    this.openMenuCommentId = this.openMenuCommentId === commentId ? null : commentId;
  }

  openReportModal(commentId: string): void {
    this.reportingCommentId = commentId;
    this.openMenuCommentId = null;
  }

  closeReportModal(): void {
    this.reportingCommentId = null;
  }

  onReportConfirm(reason: string): void {
    if (this.reportingCommentId) {
      this.reportComment(this.reportingCommentId, reason);
    }
    this.reportingCommentId = null;
  }

  reportComment(commentId: string, reason?: string): void {
    return;
  }

  toggleSaved(commentId: string): void {
    if (this.savedIds.has(commentId)) {
      this.savedIds.delete(commentId);
    } else {
      this.savedIds.add(commentId);
    }
  }

  reportComment(commentId: string): void {
    console.log('report', commentId);
  }
}
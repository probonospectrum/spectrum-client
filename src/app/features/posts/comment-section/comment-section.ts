import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PostService, SpectrumComment } from '../../../core/services/posts/post.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-comment-section',
  imports: [CommonModule, FormsModule],
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

  constructor(
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.comments = this.postService.getComments(this.postId, this.currentUser);
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
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      ...this.comments,
    ];
    this.newComment = '';
    this.commentAdded.emit();
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

  reportComment(commentId: string): void {
    return;
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

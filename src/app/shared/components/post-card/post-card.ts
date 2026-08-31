import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SpectrumPost } from '../../../core/services/posts/post.service';
import { CommentSection } from '../../../features/posts/comment-section/comment-section';

@Component({
  selector: 'app-post-card',
  imports: [CommonModule, CommentSection],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCard {
  @Input({ required: true }) post!: SpectrumPost;
  @Output() report = new EventEmitter<SpectrumPost>();

  liked = false;
  saved = false;
  commentsOpen = false;
  addedCommentsCount = 0;

  get commentsCount(): number {
    return this.post.comments + this.addedCommentsCount;
  }

  get likes(): number {
    return this.post.likes + (this.liked ? 1 : 0);
  }

  get isSaved(): boolean {
    return this.saved || this.post.saved;
  }

  toggleLike(): void {
    this.liked = !this.liked;
  }

  toggleSaved(): void {
    this.saved = !this.saved;
  }

  toggleComments(): void {
    this.commentsOpen = !this.commentsOpen;
  }

  onCommentAdded(): void {
    this.addedCommentsCount++;
  }
}
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
import { SpectrumPost } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';

const POST_EDIT_WINDOW_MS = 15 * 60 * 1000;
import { SavedPostsService } from '../../../core/services/posts/savedPost.service';

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
  @Input() showSaveButton = true;

  constructor(private savedPostsService:SavedPostsService){}

  commentsOpen = false;
  addedCommentsCount = 0;
  menuOpen = false;
  now = Date.now();
  voteState: 'up' | 'down' | null = null;
  dislikesCount = 0;

  private editWindowTimer: ReturnType<typeof setInterval> | null = null;

  toggleSaved(): void{
    this.isSaved = !this.isSaved;

     if (this.isSaved) {
    this.savedPostsService.save(this.post);
    } else {
    this.savedPostsService.unsave(this.post.id);
      }
  }
  get likes(): number {
    return this.post.likes + (this.liked ? 1 : 0);
  }

  get commentsCount(): number {
    return this.post.comments + this.addedCommentsCount;
  }

  /*get isSaved(): boolean {
    return this.post.saved;
  }*/

  get isOwnPost(): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.post.authorNickname === this.currentUser.nickname;
  }

  get canModifyOwnPost(): boolean {
    const createdAt = new Date(this.post.publishedAt).getTime();

    if (!this.isOwnPost || !Number.isFinite(createdAt)) {
      return false;
    }

    return this.now - createdAt <= POST_EDIT_WINDOW_MS;
  }

  get editWindowStatus(): string {
    return this.canModifyOwnPost ? 'Disponivel por 15 min' : 'Prazo expirado';
  }

  ngOnChanges(): void {
    this.voteState = this.post.liked ? 'up' : null;
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
    const willLike = !this.liked;

    if (willLike && this.disliked) {
      this.disliked = false;
      this.dislikesCount = Math.max(0, this.dislikesCount - 1);
    }

    this.liked = willLike;
  }

upvote(): void {
  const previousState = this.voteState;

  if (previousState === 'up') {
    if (this.post.liked) {
      this.toggleLike();
    }
    this.voteState = null;
    return;
  }

  if (previousState === 'down') {
    this.dislikesCount = Math.max(0, this.dislikesCount - 1);
  }

  if (!this.post.liked) {
    this.toggleLike();
  }
  this.voteState = 'up';
}

downvote(): void {
  const previousState = this.voteState;

  if (previousState === 'down') {
    this.voteState = null;
    this.dislikesCount = Math.max(0, this.dislikesCount - 1);
    return;
  }

  if (previousState === 'up' && this.post.liked) {
    this.toggleLike();
  }

  this.voteState = 'down';
  this.dislikesCount++;
}

  toggleSaved(): void {
    const previousPost = this.post;
    this.post = {
      ...this.post,
      saved: !this.post.saved,
    };
  }*/

  toggleComments(): void {
    this.commentsOpen = !this.commentsOpen;
  }

  goToAuthorProfile(): void {
    if (!this.post.authorNickname) {
      return;
    }

    void this.router.navigate(['/perfil', this.post.authorNickname]);
  }

  onCommentAdded(): void {
    this.addedCommentsCount++;
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
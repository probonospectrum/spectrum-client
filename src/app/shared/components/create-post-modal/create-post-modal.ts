import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MockLoadingService } from '../../../core/services/loading/mock-loading.service';
import { LocationService, SpectrumLocation } from '../../../core/services/location/location.service';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';
import { LoadingIndicator } from '../loading-indicator/loading-indicator';

@Component({
  selector: 'app-create-post-modal',
  imports: [CommonModule, FormsModule, LoadingIndicator],
  templateUrl: './create-post-modal.html',
  styleUrl: './create-post-modal.scss',
})
export class CreatePostModal implements OnChanges {
  private readonly postService = inject(PostService);
  private readonly locationService = inject(LocationService);
  private readonly mockLoadingService = inject(MockLoadingService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() user: LoggedUser | null = null;
  @Input() editingPost: SpectrumPost | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<SpectrumPost>();
  @Output() postUpdated = new EventEmitter<SpectrumPost>();

  readonly locations = this.locationService.getLocations();

  newPostContent = '';
  selectedLocation: SpectrumLocation | null = null;
  customLocationLabel = '';
  showLocationPicker = false;
  selectedMediaType: SpectrumPost['mediaType'] = 'text';
  selectedAttachmentName = '';
  errorMessage = '';
  isPublishing = signal(false);

  get displayName(): string {
    return this.user?.name || 'Usuario Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  get locationLabel(): string {
    return (
      this.selectedLocation?.label ||
      this.customLocationLabel ||
      this.user?.cityUser ||
      'Localizacao nao informada'
    );
  }

  get isEditing(): boolean {
    return Boolean(this.editingPost);
  }

  get modalTitle(): string {
    return this.isEditing ? 'Editar publicação' : 'Criar publicação';
  }

  get submitLabel(): string {
    return this.isEditing ? 'Salvar alterações' : 'Publicar';
  }

  get hasAttachment(): boolean {
    return this.selectedMediaType !== 'text';
  }

  get attachmentIcon(): string {
    return this.selectedMediaType === 'video' ? 'videocam' : 'image';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['editingPost']) {
      return;
    }

    this.newPostContent = this.editingPost?.content ?? '';
    this.customLocationLabel = this.editingPost?.authorCity ?? '';
    this.selectedLocation =
      this.locations.find((location) => location.label === this.customLocationLabel) ?? null;
    this.selectedMediaType = this.editingPost?.mediaType ?? 'text';
    this.selectedAttachmentName = this.getEditingAttachmentName();
    this.errorMessage = '';
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.showLocationPicker) {
      this.closeLocationPicker();
      return;
    }

    this.closeModal();
  }

  closeModal(): void {
    this.close.emit();
  }

  openLocationPicker(): void {
    this.showLocationPicker = true;
  }

  closeLocationPicker(): void {
    this.showLocationPicker = false;
  }

  selectLocation(location: SpectrumLocation): void {
    this.selectedLocation = location;
    this.customLocationLabel = '';
    this.closeLocationPicker();
  }

  removeLocation(): void {
    this.selectedLocation = null;
    this.customLocationLabel = '';
  }

  selectAttachment(event: Event, mediaType: 'image' | 'video'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedMediaType = mediaType;
    this.selectedAttachmentName = file.name;
  }

  removeAttachment(): void {
    this.selectedMediaType = 'text';
    this.selectedAttachmentName = '';
  }

  publishPost(): void {
    const content = this.newPostContent.trim();

    if (!content) {
      return;
    }

    const payload = {
      title: this.getPostTitle(content),
      content,
      authorCity: this.locationLabel,
      mediaType: this.selectedMediaType,
      tags: this.editingPost?.tags ?? [],
    };

    try {
      this.isPublishing.set(true);
      this.mockLoadingService
        .load(() => {
          if (this.editingPost) {
            return {
              post: this.postService.updatePost(this.editingPost.id, payload, this.user),
              editing: true,
            };
          }

          return {
            post: this.postService.createPost(payload, this.user),
            editing: false,
          };
        })
        .pipe(
          finalize(() => this.isPublishing.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (result) => {
            if (result.editing) {
              this.postUpdated.emit(result.post);
            } else {
              this.postCreated.emit(result.post);
            }

            this.closeModal();
          },
          error: (error: unknown) => {
            this.errorMessage =
              error instanceof Error ? error.message : 'Nao foi possivel salvar a publicacao.';
          },
        });
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Nao foi possivel salvar a publicacao.';
    }
  }

  private getPostTitle(content: string): string {
    return content.length > 72 ? `${content.slice(0, 69)}...` : content;
  }

  private getEditingAttachmentName(): string {
    if (!this.editingPost || this.editingPost.mediaType === 'text') {
      return '';
    }

    return this.editingPost.mediaType === 'video' ? 'Video anexado' : 'Imagem anexada';
  }
}

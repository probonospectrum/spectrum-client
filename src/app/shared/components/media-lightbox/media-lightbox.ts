import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

export interface LightboxMediaItem {
  url: string;
  type?: 'IMAGE' | 'VIDEO' | string;
  alt?: string;
}

@Component({
  selector: 'app-media-lightbox',
  imports: [CommonModule],
  templateUrl: './media-lightbox.html',
  styleUrl: './media-lightbox.scss',
})
export class MediaLightbox implements OnInit, OnDestroy {
  @Input() mediaList: LightboxMediaItem[] = [];
  @Input() initialIndex = 0;
  @Output() close = new EventEmitter<void>();

  currentIndex = 0;

  ngOnInit(): void {
    if (this.mediaList.length > 0) {
      this.currentIndex = Math.max(0, Math.min(this.initialIndex, this.mediaList.length - 1));
    } else {
      this.currentIndex = 0;
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  get currentItem(): LightboxMediaItem | undefined {
    return this.mediaList[this.currentIndex];
  }

  get isVideo(): boolean {
    const item = this.currentItem;
    if (!item) return false;
    if (item.type === 'VIDEO') return true;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(item.url);
  }

  get hasMultiple(): boolean {
    return this.mediaList.length > 1;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event?: Event): void {
    event?.preventDefault();
    this.close.emit();
  }

  @HostListener('document:keydown.arrowleft', ['$event'])
  onArrowLeft(event?: Event): void {
    if (this.hasMultiple) {
      event?.preventDefault();
      this.prev();
    }
  }

  @HostListener('document:keydown.arrowright', ['$event'])
  onArrowRight(event?: Event): void {
    if (this.hasMultiple) {
      event?.preventDefault();
      this.next();
    }
  }

  prev(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.hasMultiple) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.mediaList.length - 1;
    }
  }

  next(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.hasMultiple) return;
    if (this.currentIndex < this.mediaList.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
  }

  goTo(index: number, event?: MouseEvent): void {
    event?.stopPropagation();
    if (index >= 0 && index < this.mediaList.length) {
      this.currentIndex = index;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.classList.contains('media-lightbox') ||
      target.classList.contains('media-lightbox__body')
    ) {
      this.close.emit();
    }
  }

  onContentClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}

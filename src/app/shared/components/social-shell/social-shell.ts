import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SuggestedProfile } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-social-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './social-shell.html',
  styleUrl: './social-shell.scss',
})
export class SocialShell {
  private readonly router = inject(Router);

  @Input() user: LoggedUser | null = null;
  @Input() suggestions: SuggestedProfile[] = [];
  @Input() title = 'Publicacoes';
  @Input() subtitle = 'Atualizacoes da comunidade';
  @Input() showContentHeader = true;
  @Output() logout = new EventEmitter<void>();
  @Output() createPost = new EventEmitter<void>();

  get displayName(): string {
    return this.user?.name || 'Usuario Spectrum';
  }

  get nickname(): string {
    return this.user?.nickname || 'spectrum';
  }

  get userInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  handleCreatePost(): void {
    this.createPost.emit();
    void this.router.navigate(['/publicacoes'], { queryParams: { criar: '1' } });
  }
}

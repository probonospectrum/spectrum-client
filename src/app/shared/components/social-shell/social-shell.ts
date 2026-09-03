import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SuggestedProfile } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-social-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './social-shell.html',
  styleUrl: './social-shell.scss',
})
export class SocialShell {
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
}

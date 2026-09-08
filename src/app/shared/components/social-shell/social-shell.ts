import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuggestedProfile } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';
import { LogoutConfirm } from '../logout-confirm/logout-confirm';

interface SearchResult {
  id: number;
  name: string;
  type: 'Pessoa' | 'Cidade';
  nickname?: string;
  location?: string;
}

@Component({
  selector: 'app-social-shell',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, LogoutConfirm],
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

  // Confirmacao de logout
  isLogoutConfirmOpen = false;

  // PESQUISA 

  searchTerm = '';
  isSearching = false;
  searchResults: SearchResult[] = [];
  searchSkeletons = [1, 2, 3, 4, 5];
  private searchTimeout?: ReturnType<typeof setTimeout>;

  // Dados MOCKADOS
  private mockSearchResults: SearchResult[] = [
    {
      id: 1,
      name: 'Juliana a Banana',
      type: 'Pessoa',
      nickname: 'juliana.a.banana'
    },
    {
      id: 2,
      name: 'Carlão da ZN',
      type: 'Pessoa',
      nickname: 'carlao.zn'
    },
    {
      id: 3,
      name: 'Luana Prado',
      type: 'Pessoa',
      nickname: 'luanapradoofc'
    }, 
    {
      id: 4,
      name: 'Gustavo Lima',
      type: 'Pessoa',
      nickname: 'gustavolimaevc'
    },
    {
      id: 5,
      name: 'Guarulhos',
      location: 'São Paulo, Brasil',
      type: 'Cidade'
    },
    {
      id: 6,
      name: 'São Paulo',
      location: 'São Paulo, Brasil',
      type: 'Cidade'
    }
  ];

  // MÉTODO DA PESQUISA

  onSearch(): void {

    // Cancela a pesquisa anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const term = this.searchTerm.trim().toLowerCase();

    // Se apagou tudo
    if (!term) {
      this.isSearching = false;
      this.searchResults = [];
      return;
    }

    // Mostra os skeletons
    this.isSearching = true;
    this.searchResults = [];

    // Simula o tempo de resposta da pesquisa
    this.searchTimeout = setTimeout(() => {

      this.searchResults = this.mockSearchResults.filter(result =>
        result.name.toLowerCase().includes(term) ||
        result.nickname?.toLowerCase().includes(term) ||
        result.location?.toLowerCase().includes(term) ||
        result.type.toLowerCase().includes(term)

      );
      this.isSearching = false;
    }, 600);
  }

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

  openLogoutConfirm(): void {
    this.isLogoutConfirmOpen = true;
  }

  cancelLogout(): void {
    this.isLogoutConfirmOpen = false;
  }

  confirmLogout(): void {
    this.isLogoutConfirmOpen = false;
    this.logout.emit();
  }

  closeSearch(): void {
    this.isSearching = false;
    this.searchResults = [];
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSearch();
    }
  }
}

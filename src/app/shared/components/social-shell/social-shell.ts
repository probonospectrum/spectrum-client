import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuggestedProfile } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';

interface SearchResult {
  id: number;
  name: string;
  description: string;
  type: 'Pessoa' | 'Comunidade' | 'Publicação';
}

@Component({
  selector: 'app-social-shell',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
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
      name: 'Ana Souza',
      description: 'Desenvolvedora de Software',
      type: 'Pessoa'
    },
    {
      id: 2,
      name: 'João Silva',
      description: 'Estudante de tecnologia',
      type: 'Pessoa'
    },
    {
      id: 3,
      name: 'Comunidade de Tecnologia',
      description: 'Compartilhe conhecimentos sobre tecnologia',
      type: 'Comunidade'
    },
    {
      id: 4,
      name: 'Programação e Desenvolvimento',
      description: 'Espaço para conversar sobre programação',
      type: 'Comunidade'
    },
    {
      id: 5,
      name: 'Como começar na programação?',
      description: 'Publicação • 12 comentários',
      type: 'Publicação'
    },
    {
      id: 6,
      name: 'Desenvolvimento Web',
      description: 'Publicação • 8 comentários',
      type: 'Publicação'
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
        result.description.toLowerCase().includes(term) ||
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
}

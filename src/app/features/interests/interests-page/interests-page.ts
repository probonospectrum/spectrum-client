import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Interest {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-interests-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interests-page.html',
  styleUrl: './interests-page.scss',
})
export class InterestsPage {
  @Output() fechou = new EventEmitter<string[]>();

  readonly interests: Interest[] = [
    { id: 'tecnologia', name: 'Tecnologia', description: 'Programação, inovação e tecnologia', icon: '💻' },
    { id: 'games', name: 'Games', description: 'Jogos, consoles e cultura gamer', icon: '🎮' },
    { id: 'musica', name: 'Música', description: 'Artistas, bandas e novidades', icon: '🎵' },
    { id: 'filmes-series', name: 'Filmes e séries', description: 'Cinema, séries e entretenimento', icon: '🎬' },
    { id: 'esportes', name: 'Esportes', description: 'Futebol, basquete e outros esportes', icon: '⚽' },
    { id: 'arte', name: 'Arte', description: 'Design, ilustração e criatividade', icon: '🎨' },
    { id: 'livros', name: 'Livros', description: 'Literatura, leitura e escrita', icon: '📚' },
    { id: 'viagens', name: 'Viagens', description: 'Destinos, experiências e turismo', icon: '✈️' },
    { id: 'fotografia', name: 'Fotografia', description: 'Fotos, câmeras e edição', icon: '📷' },
    { id: 'culinaria', name: 'Culinária', description: 'Receitas, gastronomia e comida', icon: '🍳' },
    { id: 'ciencia', name: 'Ciência', description: 'Descobertas, espaço e conhecimento', icon: '🔬' },
    { id: 'moda', name: 'Moda', description: 'Estilo, tendências e beleza', icon: '👗' },
  ];

  private selectedIds = new Set<string>();

  isSelected(interest: Interest): boolean {
    return this.selectedIds.has(interest.id);
  }

  toggleInterest(interest: Interest): void {
    if (this.selectedIds.has(interest.id)) {
      this.selectedIds.delete(interest.id);
    } else {
      this.selectedIds.add(interest.id);
    }
  }

  get selectedInterests(): Interest[] {
    return this.interests.filter((interest) => this.selectedIds.has(interest.id));
  }

  continue(): void {
    if (this.selectedIds.size === 0) {
      return;
    }

    this.fechou.emit(Array.from(this.selectedIds));
  }
}

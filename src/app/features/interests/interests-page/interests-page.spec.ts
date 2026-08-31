import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Interest {
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-interests-page',
  imports: [
    CommonModule,
  ],
  templateUrl: './interests-page.html',
  styleUrl: './interests-page.scss',
})
export class InterestsPage {
  private readonly router = inject(Router);

  readonly interests: Interest[] = [
    {
      name: 'Tecnologia',
      description: 'Programação, inovação e tecnologia',
      icon: '💻',
    },
    {
      name: 'Games',
      description: 'Jogos, consoles e cultura gamer',
      icon: '🎮',
    },
    {
      name: 'Música',
      description: 'Artistas, bandas e novidades',
      icon: '🎵',
    },
    {
      name: 'Filmes e séries',
      description: 'Cinema, séries e entretenimento',
      icon: '🎬',
    },
    {
      name: 'Esportes',
      description: 'Futebol, basquete e outros esportes',
      icon: '⚽',
    },
    {
      name: 'Arte',
      description: 'Design, ilustração e criatividade',
      icon: '🎨',
    },
    {
      name: 'Livros',
      description: 'Literatura, leitura e escrita',
      icon: '📚',
    },
    {
      name: 'Viagens',
      description: 'Destinos, experiências e turismo',
      icon: '✈️',
    },
    {
      name: 'Fotografia',
      description: 'Fotos, câmeras e edição',
      icon: '📷',
    },
    {
      name: 'Culinária',
      description: 'Receitas, gastronomia e comida',
      icon: '🍳',
    },
    {
      name: 'Ciência',
      description: 'Descobertas, espaço e conhecimento',
      icon: '🔬',
    },
    {
      name: 'Moda',
      description: 'Estilo, tendências e beleza',
      icon: '👗',
    },
  ];

  selectedInterests: Interest[] = [];

  isSelected(interest: Interest): boolean {
    return this.selectedInterests.some(
      (selected) => selected.name === interest.name,
    );
  }

  toggleInterest(interest: Interest): void {
    if (this.isSelected(interest)) {
      this.selectedInterests = this.selectedInterests.filter(
        (selected) => selected.name !== interest.name,
      );
      return;
    }

    this.selectedInterests = [
      ...this.selectedInterests,
      interest,
    ];
  }

  continue(): void {
    if (this.selectedInterests.length === 0) {
      return;
    }

    console.log('Interesses selecionados:', this.selectedInterests);
    void this.router.navigateByUrl('/home');
  }
}
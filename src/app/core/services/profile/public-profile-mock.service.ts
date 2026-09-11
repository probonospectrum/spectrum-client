import { Injectable } from '@angular/core';
import { SpectrumPost } from '../posts/post.service';

/**
 * Representa o perfil publico de um usuario visto por outra pessoa.
 * Usado para exibir a tela de perfil de terceiros com dados mocados,
 * sem depender do backend.
 */
export interface PublicProfile {
  nickname: string;
  name: string;
  initial: string;
  city: string;
  joinedDate: string;
  bio: string;
  coverUrl: string;
  followingCount: number;
  followersCount: number;
  verified: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PublicProfileMockService {
  private readonly profiles: PublicProfile[] = [
    {
      nickname: 'helena.matsunaga',
      name: 'Helena Matsunaga',
      initial: 'H',
      city: 'Liberdade, Sao Paulo - SP',
      joinedDate: 'Março de 2026',
      bio: 'Fotografa urbana e voluntaria em projetos de bairro. Compartilho alertas e boas noticias da comunidade.',
      coverUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
      followingCount: 182,
      followersCount: 1240,
      verified: true,
    },
  ];

  private readonly postsByNickname: Record<string, SpectrumPost[]> = {
    'helena.matsunaga': [
      {
        id: 'mock-helena-1',
        authorName: 'Helena Matsunaga',
        authorNickname: 'helena.matsunaga',
        authorInitial: 'H',
        authorCity: 'Liberdade, Sao Paulo - SP',
        title: 'Feira cultural na Liberdade neste fim de semana',
        content:
          'Vai rolar feira de artesanato e comida japonesa na praca da Liberdade. Levem a familia, o ambiente estara todo decorado!',
        mediaType: 'image',
        createdAt: '2026-05-02T13:00:00.000Z',
        publishedAt: '2026-05-02T13:00:00.000Z',
        publishedAtLabel: 'Publicado em 02/05/2026, as 10:00',
        likes: 156,
        liked: false,
        comments: 8,
        reposts: 12,
        reposted: false,
        saved: false,
        tags: ['cultura', 'liberdade', 'evento'],
      },
      {
        id: 'mock-helena-2',
        authorName: 'Helena Matsunaga',
        authorNickname: 'helena.matsunaga',
        authorInitial: 'H',
        authorCity: 'Liberdade, Sao Paulo - SP',
        title: 'Mutirao de limpeza deu certo',
        content:
          'Obrigada a todos que participaram do mutirao de ontem. A praca ficou outra! Juntos cuidamos melhor do nosso bairro.',
        mediaType: 'text',
        createdAt: '2026-04-28T21:30:00.000Z',
        publishedAt: '2026-04-28T21:30:00.000Z',
        publishedAtLabel: 'Publicado em 28/04/2026, as 18:30',
        likes: 203,
        liked: false,
        comments: 15,
        reposts: 6,
        reposted: false,
        saved: false,
        tags: ['comunidade', 'voluntariado'],
      },
    ],
  };

  getProfile(nickname: string): PublicProfile | null {
    return this.profiles.find((profile) => profile.nickname === nickname) ?? null;
  }

  /**
   * Retorna sempre um perfil publico para o nickname informado.
   * Se o usuario nao estiver mocado, monta um perfil generico a partir
   * dos posts existentes desse autor (ou do proprio nickname), garantindo
   * que a visao de terceiro nunca caia no perfil proprio.
   */
  getProfileOrFallback(nickname: string, posts: SpectrumPost[]): PublicProfile {
    const known = this.getProfile(nickname);

    if (known) {
      return known;
    }

    const authorPosts = posts.filter((post) => post.authorNickname === nickname);
    const authorPost = authorPosts[0];
    const name = authorPost?.authorName || nickname;
    const initial = authorPost?.authorInitial || name.charAt(0).toUpperCase() || '?';
    const city = authorPost?.authorCity || 'Localizacao nao informada';

    return {
      nickname,
      name,
      initial,
      city,
      joinedDate: this.resolveJoinedDate(authorPosts),
      bio: 'Este usuario ainda nao adicionou uma bio.',
      coverUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80',
      followingCount: 0,
      followersCount: 0,
      verified: false,
    };
  }

  getPosts(nickname: string): SpectrumPost[] {
    return (this.postsByNickname[nickname] ?? []).map((post) => ({ ...post }));
  }

  /**
   * Deriva uma data de entrada valida ("Mes de Ano") a partir da publicacao
   * mais antiga do autor. Sem posts, usa uma data padrao.
   */
  private resolveJoinedDate(authorPosts: SpectrumPost[]): string {
    const timestamps = authorPosts
      .map((post) => new Date(post.publishedAt).getTime())
      .filter((time) => Number.isFinite(time));

    const oldest = timestamps.length ? new Date(Math.min(...timestamps)) : new Date('2026-01-15');

    return this.formatJoinedDate(oldest);
  }

  private formatJoinedDate(date: Date): string {
    const label = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(date);

    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}

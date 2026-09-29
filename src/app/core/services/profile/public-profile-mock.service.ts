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
      nickname: 'ana.martins',
      name: 'Ana Martins',
      initial: 'A',
      city: 'São Paulo - SP',
      joinedDate: 'Fevereiro de 2026',
      bio: 'Converso sobre educação, convivência e maneiras de criar espaços em que mais pessoas sejam ouvidas.',
      coverUrl: '/Background.png',
      followingCount: 84,
      followersCount: 126,
      verified: false,
    },
    {
      nickname: 'lucas.oliveira',
      name: 'Lucas Oliveira',
      initial: 'L',
      city: 'Guarulhos - SP',
      joinedDate: 'Março de 2026',
      bio: 'Compartilho questões de acessibilidade e melhorias que podem tornar a cidade mais segura para todo mundo.',
      coverUrl: '/Background.png',
      followingCount: 67,
      followersCount: 94,
      verified: false,
    },
    {
      nickname: 'marina.costa',
      name: 'Marina Costa',
      initial: 'M',
      city: 'Recife - PE',
      joinedDate: 'Janeiro de 2026',
      bio: 'Acompanho conversas da comunidade e gosto de registrar tanto os problemas quanto as mudanças que deram certo.',
      coverUrl: '/Background.png',
      followingCount: 103,
      followersCount: 158,
      verified: false,
    },
    {
      nickname: 'gabriel.santos',
      name: 'Gabriel Santos',
      initial: 'G',
      city: 'Campinas - SP',
      joinedDate: 'Abril de 2026',
      bio: 'Buscando aprender formas mais respeitosas de apoiar as pessoas e melhorar a convivência nos espaços que frequento.',
      coverUrl: '/Background.png',
      followingCount: 52,
      followersCount: 73,
      verified: false,
    },
    {
      nickname: 'beatriz.lima',
      name: 'Beatriz Lima',
      initial: 'B',
      city: 'São Paulo - SP',
      joinedDate: 'Maio de 2026',
      bio: 'Falo sobre respeito, inclusão e pequenas atitudes que ajudam a transformar a convivência no dia a dia.',
      coverUrl: '/Background.png',
      followingCount: 76,
      followersCount: 111,
      verified: false,
    },
  ];

  private readonly postsByNickname: Record<string, SpectrumPost[]> = {};

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
      coverUrl: '/Background.png',
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

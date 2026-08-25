import { Injectable } from '@angular/core';
import { LoggedUser } from '../user/user.service';

export interface SpectrumPost {
  id: string;
  authorName: string;
  authorNickname: string;
  authorInitial: string;
  authorCity: string;
  title: string;
  content: string;
  mediaType: 'video' | 'text' | 'image';
  publishedAt: string;
  publishedAtLabel: string;
  likes: number;
  comments: number;
  shares: number;
  saved: boolean;
  tags: string[];
}

export interface SuggestedProfile {
  name: string;
  nickname: string;
  initial: string;
  verified: boolean;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  authorCity: string;
  mediaType: SpectrumPost['mediaType'];
  tags: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly storageKey = 'spectrum-mock-posts';

  readonly suggestions: SuggestedProfile[] = [
    { name: 'Juliana a Banana', nickname: 'juliana.a.banana', initial: 'https://i.pinimg.com/236x/d1/e3/d2/d1e3d2a12bc3d0221898c4391dffcfff.jpg', verified: true },
    { name: 'Carlao da ZN', nickname: 'carlao.zn', initial: 'C', verified: true },
    { name: 'Luana Prado', nickname: 'luanapradoofc', initial: 'L', verified: true },
    { name: 'Gustavo Lima', nickname: 'gustavolimaevc', initial: 'G', verified: true },
  ];

  getPosts(): SpectrumPost[] {
    return [...this.getUserPosts(), ...this.getDefaultPosts()].sort(
      (first, second) =>
        new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime(),
    );
  }

  createPost(payload: CreatePostPayload, user: LoggedUser | null): SpectrumPost {
    const now = new Date();
    const authorName = user?.name || 'Usuario Spectrum';
    const authorNickname = user?.nickname || 'spectrum';
    const post: SpectrumPost = {
      id: `local-${now.getTime()}`,
      authorName,
      authorNickname,
      authorInitial: authorName.charAt(0).toUpperCase(),
      authorCity: payload.authorCity.trim(),
      title: payload.title.trim(),
      content: payload.content.trim(),
      mediaType: payload.mediaType,
      publishedAt: now.toISOString(),
      publishedAtLabel: this.formatPublishedAt(now),
      likes: 0,
      comments: 0,
      shares: 0,
      saved: false,
      tags: payload.tags,
    };

    localStorage.setItem(this.storageKey, JSON.stringify([post, ...this.getUserPosts()]));
    return post;
  }

  private getUserPosts(): SpectrumPost[] {
    const rawPosts = localStorage.getItem(this.storageKey);

    if (!rawPosts) {
      return [];
    }

    try {
      return JSON.parse(rawPosts) as SpectrumPost[];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private getDefaultPosts(): SpectrumPost[] {
    return [
      {
        id: 'mock-1',
        authorName: 'Elena Matsunaga',
        authorNickname: 'ElenMatisu04',
        authorInitial: 'E',
        authorCity: 'Av Mem de Sa, Xique-Xique - BA',
        title: 'Fim dos tempos em Xique-Xique',
        content:
          'Roubaram meu Livinho e agora a rua inteira esta tentando entender como isso aconteceu.',
        mediaType: 'video',
        publishedAt: '2026-04-09T10:46:00.000Z',
        publishedAtLabel: 'Publicado em 09/04/2026, as 07:46',
        likes: 310,
        comments: 25,
        shares: 8,
        saved: false,
        tags: ['bairro', 'alerta', 'xique-xique'],
      },
      {
        id: 'mock-2',
        authorName: 'Nadia Costa',
        authorNickname: 'nadiacosta',
        authorInitial: 'N',
        authorCity: 'Centro, Feira de Santana - BA',
        title: 'Movimento estranho perto da praca',
        content:
          'Vi uma movimentacao diferente agora cedo. Quem mora perto consegue confirmar se esta tudo certo?',
        mediaType: 'image',
        publishedAt: '2026-04-08T19:20:00.000Z',
        publishedAtLabel: 'Publicado em 08/04/2026, as 16:20',
        likes: 184,
        comments: 14,
        shares: 5,
        saved: true,
        tags: ['seguranca', 'centro'],
      },
      {
        id: 'mock-3',
        authorName: 'Rafael Lima',
        authorNickname: 'rafa.lima',
        authorInitial: 'R',
        authorCity: 'Jardim Paulista, Sao Paulo - SP',
        title: 'Achados e perdidos da comunidade',
        content:
          'Criamos um ponto de apoio para documentos, chaves e pequenos objetos encontrados no bairro.',
        mediaType: 'text',
        publishedAt: '2026-04-07T12:10:00.000Z',
        publishedAtLabel: 'Publicado em 07/04/2026, as 09:10',
        likes: 92,
        comments: 7,
        shares: 3,
        saved: false,
        tags: ['comunidade', 'servico'],
      },
    ];
  }

  private formatPublishedAt(date: Date): string {
    const day = new Intl.DateTimeFormat('pt-BR').format(date);
    const time = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

    return `Publicado em ${day}, as ${time}`;
  }
}

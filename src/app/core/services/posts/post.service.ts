import { Injectable } from '@angular/core';
import { LoggedUser } from '../user/user.service';

export interface SpectrumPost {
  id: string;
  createdAt: string;
  createdBy?: string;
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
  liked: boolean;
  comments: number;
  reposts: number;
  reposted: boolean;
  saved: boolean;
  tags: string[];
  originalPostId?: string;
  updatedAt?: string;
}

export interface SpectrumComment {
  id: string;
  authorName: string;
  authorInitial: string;
  content: string;
  dateLabel: string;
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
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

export interface RepostRecord {
  id: string;
  userId: string;
  originalPostId: string;
  createdAt: string;
}

export interface RepostToggleResult {
  post: SpectrumPost;
  reposted: boolean;
}

export interface PostInteractionRecord {
  userId: string;
  postId: string;
  liked?: boolean;
  saved?: boolean;
}

export interface CommentInteractionRecord {
  userId: string;
  commentId: string;
  liked?: boolean;
  disliked?: boolean;
}

export const POST_EDIT_WINDOW_MS = 15 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly storageKey = 'spectrum-mock-posts';
  private readonly repostStorageKey = 'spectrum-reposts';
  private readonly postInteractionStorageKey = 'spectrum-post-interactions';
  private readonly commentInteractionStorageKey = 'spectrum-comment-interactions';

  readonly suggestions: SuggestedProfile[] = [
    {
      name: 'Juliana a Banana',
      nickname: 'juliana.a.banana',
      initial: 'https://i.pinimg.com/236x/d1/e3/d2/d1e3d2a12bc3d0221898c4391dffcfff.jpg',
      verified: true,
    },
    { name: 'Carlao da ZN', nickname: 'carlao.zn', initial: 'C', verified: true },
    { name: 'Luana Prado', nickname: 'luanapradoofc', initial: 'L', verified: true },
    { name: 'Gustavo Lima', nickname: 'gustavolimaevc', initial: 'G', verified: true },
  ];

  private readonly commentsByPost: Record<string, SpectrumComment[]> = {
    'mock-1': [
      {
        id: 'c-1-1',
        authorName: 'Hater da Matisunaga',
        authorInitial: 'H',
        content: 'Mentiraaaaa',
        dateLabel: 'Há 2h',
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-1-2',
        authorName: 'João Pereira',
        authorInitial: 'J',
        content: 'Isso já aconteceu comigo também, muito cuidado.',
        dateLabel: 'Há 3h',
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-1-3',
        authorName: 'Márcia Souza',
        authorInitial: 'M',
        content: 'Registrei ocorrência, procurem a delegacia mais próxima.',
        dateLabel: 'Há 4h',
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
    ],
    'mock-2': [
      {
        id: 'c-2-1',
        authorName: 'Paulo Henrique',
        authorInitial: 'P',
        content: 'Vi também, chamei a guarda municipal.',
        dateLabel: 'Há 1h',
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-2-2',
        authorName: 'Camila Rocha',
        authorInitial: 'C',
        content: 'Confirmado, já está tudo resolvido.',
        dateLabel: 'Há 5h',
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
    ],
    'mock-3': [
      {
        id: 'c-3-1',
        authorName: 'Bianca Alves',
        authorInitial: 'B',
        content: 'Excelente iniciativa, parabéns!',
        dateLabel: 'Há 1d',
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
    ],
  };

  getPosts(user: LoggedUser | null = null): SpectrumPost[] {
    return [...this.getUserPosts(), ...this.getDefaultPosts()]
      .map((post) => this.withPostState(post, user))
      .sort(
        (first, second) =>
          new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime(),
      );
  }

  getUserReposts(user: LoggedUser | null): SpectrumPost[] {
    const userId = this.getUserKey(user);

    if (!userId) {
      return [];
    }

    const postsById = new Map(
      [...this.getUserPosts(), ...this.getDefaultPosts()].map((post) => [post.id, post]),
    );

    return this.getRepostRecords()
      .filter((repost) => repost.userId === userId)
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      )
      .map((repost) => postsById.get(repost.originalPostId))
      .filter((post): post is SpectrumPost => Boolean(post))
      .map((post) => this.withPostState(post, user));
  }

  getUserSavedPosts(user: LoggedUser | null): SpectrumPost[] {
    if (!this.getUserKey(user)) {
      return [];
    }

    return this.getPosts(user).filter((post) => post.saved);
  }

  findPostById(id: string, user: LoggedUser | null = null): SpectrumPost | null {
    const post = [...this.getUserPosts(), ...this.getDefaultPosts()].find((item) => item.id === id);
    return post ? this.withPostState(post, user) : null;
  }

  getComments(postId: string, user: LoggedUser | null = null): SpectrumComment[] {
    return (this.commentsByPost[postId] ?? []).map((comment) =>
      this.withCommentState(comment, user),
    );
  }

  createPost(payload: CreatePostPayload, user: LoggedUser | null): SpectrumPost {
    const now = new Date();
    const authorName = user?.name || 'Usuario Spectrum';
    const authorNickname = user?.nickname || 'spectrum';
    const post: SpectrumPost = {
      id: `local-${now.getTime()}`,
      createdAt: now.toISOString(),
      createdBy: user?._id,
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
      liked: false,
      comments: 0,
      reposts: 0,
      reposted: false,
      saved: false,
      tags: payload.tags,
    };

    localStorage.setItem(this.storageKey, JSON.stringify([post, ...this.getUserPosts()]));
    return post;
  }

  togglePostLike(post: SpectrumPost, user: LoggedUser | null): SpectrumPost {
    const userId = this.requireUserKey(user, 'Entre na sua conta para curtir.');
    const postId = post.originalPostId ?? post.id;
    const basePost = this.findRawPost(postId) ?? this.withoutComputedPostState({ ...post, id: postId });
    const records = this.getPostInteractionRecords();
    const record = this.getOrCreatePostInteractionRecord(records, userId, postId);
    const currentPost = this.withPostState(basePost, user);

    record.liked = !currentPost.liked;
    this.savePostInteractionRecords(records);

    return this.withPostState(basePost, user);
  }

  togglePostSaved(post: SpectrumPost, user: LoggedUser | null): SpectrumPost {
    const userId = this.requireUserKey(user, 'Entre na sua conta para salvar.');
    const postId = post.originalPostId ?? post.id;
    const basePost = this.findRawPost(postId) ?? this.withoutComputedPostState({ ...post, id: postId });
    const records = this.getPostInteractionRecords();
    const record = this.getOrCreatePostInteractionRecord(records, userId, postId);
    const currentPost = this.withPostState(basePost, user);

    record.saved = !currentPost.saved;
    this.savePostInteractionRecords(records);

    return this.withPostState(basePost, user);
  }

  toggleCommentLike(comment: SpectrumComment, user: LoggedUser | null): SpectrumComment {
    const userId = this.requireUserKey(user, 'Entre na sua conta para curtir.');
    const baseComment = this.findRawComment(comment.id) ?? this.withoutComputedCommentState(comment);
    const records = this.getCommentInteractionRecords();
    const record = this.getOrCreateCommentInteractionRecord(records, userId, comment.id);
    const currentComment = this.withCommentState(baseComment, user);

    record.liked = !currentComment.liked;

    if (record.liked) {
      record.disliked = false;
    }

    this.saveCommentInteractionRecords(records);

    return this.withCommentState(baseComment, user);
  }

  toggleCommentDislike(comment: SpectrumComment, user: LoggedUser | null): SpectrumComment {
    const userId = this.requireUserKey(user, 'Entre na sua conta para descurtir.');
    const baseComment = this.findRawComment(comment.id) ?? this.withoutComputedCommentState(comment);
    const records = this.getCommentInteractionRecords();
    const record = this.getOrCreateCommentInteractionRecord(records, userId, comment.id);
    const currentComment = this.withCommentState(baseComment, user);

    record.disliked = !currentComment.disliked;

    if (record.disliked) {
      record.liked = false;
    }

    this.saveCommentInteractionRecords(records);

    return this.withCommentState(baseComment, user);
  }

  updatePost(id: string, payload: CreatePostPayload, user: LoggedUser | null): SpectrumPost {
    const posts = this.getUserPosts();
    const index = posts.findIndex((post) => post.id === id);

    if (index < 0) {
      throw new Error('Publicacao nao encontrada para edicao.');
    }

    const currentPost = this.withPostState(posts[index], user);

    if (!this.canModifyPost(currentPost, user)) {
      throw new Error('O prazo para editar esta publicacao expirou.');
    }

    const updatedPost: SpectrumPost = {
      ...posts[index],
      authorCity: payload.authorCity.trim(),
      title: payload.title.trim(),
      content: payload.content.trim(),
      mediaType: payload.mediaType,
      tags: payload.tags,
      updatedAt: new Date().toISOString(),
    };

    posts[index] = this.withoutComputedPostState(updatedPost);
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
    return this.withPostState(updatedPost, user);
  }

  deletePost(id: string, user: LoggedUser | null): void {
    const posts = this.getUserPosts();
    const post = posts.find((item) => item.id === id);

    if (!post) {
      throw new Error('Publicacao nao encontrada para exclusao.');
    }

    if (!this.isOwnPost(this.withPostState(post, user), user)) {
      throw new Error('Voce so pode excluir suas proprias publicacoes.');
    }

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(posts.filter((item) => item.id !== id)),
    );
    localStorage.setItem(
      this.repostStorageKey,
      JSON.stringify(this.getRepostRecords().filter((repost) => repost.originalPostId !== id)),
    );
  }

  toggleRepost(post: SpectrumPost, user: LoggedUser | null): RepostToggleResult {
    const userId = this.requireUserKey(user, 'Entre na sua conta para repostar.');

    const originalPostId = post.originalPostId ?? post.id;
    const records = this.getRepostRecords();
    const existingIndex = records.findIndex(
      (repost) => repost.userId === userId && repost.originalPostId === originalPostId,
    );

    if (existingIndex >= 0) {
      records.splice(existingIndex, 1);
      localStorage.setItem(this.repostStorageKey, JSON.stringify(records));
      return {
        post: this.findPostById(originalPostId, user) ?? this.withPostState(post, user),
        reposted: false,
      };
    }

    records.unshift({
      id: `repost-${userId}-${originalPostId}`,
      userId,
      originalPostId,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(this.repostStorageKey, JSON.stringify(records));

    return {
      post: this.findPostById(originalPostId, user) ?? this.withPostState(post, user),
      reposted: true,
    };
  }

  canModifyPost(post: SpectrumPost, user: LoggedUser | null, now = Date.now()): boolean {
    const createdAt = new Date(post.createdAt || post.publishedAt).getTime();

    if (!Number.isFinite(createdAt)) {
      return false;
    }

    return this.isOwnPost(post, user) && now - createdAt <= POST_EDIT_WINDOW_MS;
  }

  isOwnPost(post: SpectrumPost, user: LoggedUser | null): boolean {
    if (!user) {
      return false;
    }

    return post.createdBy === user._id || post.authorNickname === user.nickname;
  }

  private getUserPosts(): SpectrumPost[] {
    const rawPosts = localStorage.getItem(this.storageKey);

    if (!rawPosts) {
      return [];
    }

    try {
      return (JSON.parse(rawPosts) as SpectrumPost[]).map((post) => this.normalizePost(post));
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private findRawPost(id: string): SpectrumPost | null {
    return [...this.getUserPosts(), ...this.getDefaultPosts()].find((post) => post.id === id) ?? null;
  }

  private findRawComment(id: string): SpectrumComment | null {
    for (const comments of Object.values(this.commentsByPost)) {
      const comment = comments.find((item) => item.id === id);

      if (comment) {
        return comment;
      }
    }

    return null;
  }

  private getRepostRecords(): RepostRecord[] {
    const rawRecords = localStorage.getItem(this.repostStorageKey);

    if (!rawRecords) {
      return [];
    }

    try {
      return JSON.parse(rawRecords) as RepostRecord[];
    } catch {
      localStorage.removeItem(this.repostStorageKey);
      return [];
    }
  }

  private getPostInteractionRecords(): PostInteractionRecord[] {
    const rawRecords = localStorage.getItem(this.postInteractionStorageKey);

    if (!rawRecords) {
      return [];
    }

    try {
      return JSON.parse(rawRecords) as PostInteractionRecord[];
    } catch {
      localStorage.removeItem(this.postInteractionStorageKey);
      return [];
    }
  }

  private savePostInteractionRecords(records: PostInteractionRecord[]): void {
    localStorage.setItem(this.postInteractionStorageKey, JSON.stringify(records));
  }

  private getCommentInteractionRecords(): CommentInteractionRecord[] {
    const rawRecords = localStorage.getItem(this.commentInteractionStorageKey);

    if (!rawRecords) {
      return [];
    }

    try {
      return JSON.parse(rawRecords) as CommentInteractionRecord[];
    } catch {
      localStorage.removeItem(this.commentInteractionStorageKey);
      return [];
    }
  }

  private saveCommentInteractionRecords(records: CommentInteractionRecord[]): void {
    localStorage.setItem(this.commentInteractionStorageKey, JSON.stringify(records));
  }

  private getDefaultPosts(): SpectrumPost[] {
    return [
      {
        id: 'mock-gabi-1',
        createdAt: '2026-04-10T14:30:00.000Z',
        authorName: 'gabi',
        authorNickname: 'gabi',
        authorInitial: 'G',
        authorCity: 'Lencois Maranhenses, Barreirinhas - MA',
        title: 'Minha primeira vez nos Lencois Maranhenses',
        content:
          'Gente, nao tem como descrever essa experiencia. A agua cristalina entre as dunas e algo surreal. Recomendo demais pra quem quer se reconectar com a natureza!',
        mediaType: 'image',
        publishedAt: '2026-04-10T14:30:00.000Z',
        publishedAtLabel: 'Publicado em 10/04/2026, as 11:30',
        likes: 47,
        liked: false,
        comments: 12,
        reposts: 3,
        reposted: false,
        saved: false,
        tags: [],
      },
      {
        id: 'mock-1',
        createdAt: '2026-04-09T10:46:00.000Z',
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
        liked: false,
        comments: 3,
        reposts: 8,
        reposted: false,
        saved: false,
        tags: ['bairro', 'alerta', 'xique-xique'],
      },
      {
        id: 'mock-2',
        createdAt: '2026-04-08T19:20:00.000Z',
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
        liked: false,
        comments: 2,
        reposts: 5,
        reposted: false,
        saved: true,
        tags: ['seguranca', 'centro'],
      },
      {
        id: 'mock-3',
        createdAt: '2026-04-07T12:10:00.000Z',
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
        liked: false,
        comments: 1,
        reposts: 3,
        reposted: false,
        saved: false,
        tags: ['comunidade', 'servico'],
      },
    ];
  }

  private withPostState(post: SpectrumPost, user: LoggedUser | null): SpectrumPost {
    const normalizedPost = this.normalizePost(post);
    const userId = this.getUserKey(user);
    const originalPostId = normalizedPost.originalPostId ?? normalizedPost.id;
    const reposts = this.getRepostRecords().filter(
      (repost) => repost.originalPostId === originalPostId,
    );
    const postInteractions = this.getPostInteractionRecords().filter(
      (record) => record.postId === originalPostId,
    );
    const currentUserInteraction = userId
      ? postInteractions.find((record) => record.userId === userId)
      : undefined;

    return {
      ...normalizedPost,
      likes: normalizedPost.likes + postInteractions.filter((record) => record.liked).length,
      liked: currentUserInteraction?.liked ?? false,
      saved: currentUserInteraction?.saved ?? normalizedPost.saved,
      reposts: normalizedPost.reposts + reposts.length,
      reposted: userId ? reposts.some((repost) => repost.userId === userId) : false,
    };
  }

  private normalizePost(post: SpectrumPost): SpectrumPost {
    const postWithLegacyShares = post as SpectrumPost & { shares?: number };
    const createdAt = post.createdAt || post.publishedAt;

    return {
      ...post,
      createdAt,
      liked: post.liked ?? false,
      reposts: post.reposts ?? postWithLegacyShares.shares ?? 0,
      reposted: post.reposted ?? false,
    };
  }

  private withoutComputedPostState(post: SpectrumPost): SpectrumPost {
    const postId = post.originalPostId ?? post.id;
    const interactionLikes = this.getPostInteractionRecords().filter(
      (record) => record.postId === postId && record.liked,
    ).length;
    const reposts = this.getRepostRecords().filter(
      (repost) => repost.originalPostId === postId,
    ).length;

    return {
      ...post,
      likes: Math.max(0, post.likes - interactionLikes),
      liked: false,
      reposts: Math.max(0, post.reposts - reposts),
      reposted: false,
    };
  }

  private withoutComputedCommentState(comment: SpectrumComment): SpectrumComment {
    const interactions = this.getCommentInteractionRecords().filter(
      (record) => record.commentId === comment.id,
    );

    return {
      ...comment,
      likes: Math.max(0, comment.likes - interactions.filter((record) => record.liked).length),
      dislikes: Math.max(
        0,
        comment.dislikes - interactions.filter((record) => record.disliked).length,
      ),
      liked: false,
      disliked: false,
    };
  }

  private withCommentState(comment: SpectrumComment, user: LoggedUser | null): SpectrumComment {
    const userId = this.getUserKey(user);
    const interactions = this.getCommentInteractionRecords().filter(
      (record) => record.commentId === comment.id,
    );
    const currentUserInteraction = userId
      ? interactions.find((record) => record.userId === userId)
      : undefined;

    return {
      ...comment,
      likes: comment.likes + interactions.filter((record) => record.liked).length,
      dislikes: comment.dislikes + interactions.filter((record) => record.disliked).length,
      liked: currentUserInteraction?.liked ?? false,
      disliked: currentUserInteraction?.disliked ?? false,
    };
  }

  private getOrCreatePostInteractionRecord(
    records: PostInteractionRecord[],
    userId: string,
    postId: string,
  ): PostInteractionRecord {
    const existingRecord = records.find(
      (record) => record.userId === userId && record.postId === postId,
    );

    if (existingRecord) {
      return existingRecord;
    }

    const record: PostInteractionRecord = { userId, postId };
    records.push(record);
    return record;
  }

  private getOrCreateCommentInteractionRecord(
    records: CommentInteractionRecord[],
    userId: string,
    commentId: string,
  ): CommentInteractionRecord {
    const existingRecord = records.find(
      (record) => record.userId === userId && record.commentId === commentId,
    );

    if (existingRecord) {
      return existingRecord;
    }

    const record: CommentInteractionRecord = { userId, commentId };
    records.push(record);
    return record;
  }

  private requireUserKey(user: LoggedUser | null, message: string): string {
    const userId = this.getUserKey(user);

    if (!userId) {
      throw new Error(message);
    }

    return userId;
  }

  private getUserKey(user: LoggedUser | null): string {
    return user?._id || user?.nickname || '';
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

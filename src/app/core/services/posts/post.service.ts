import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';
import { LoggedUser } from '../user/user.service';

export type OccurrenceStatus =
  | 'ABERTA'
  | 'ENCAMINHADA'
  | 'EM_ANALISE'
  | 'RESOLUCAO_INFORMADA'
  | 'RESOLVIDA'
  | 'CONTESTADA'
  | 'REABERTA'
  | 'SEM_ORGAO_IDENTIFICADO';

export type OccurrenceImportance = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type OccurrenceCategory =
  | 'INFRAESTRUTURA'
  | 'ILUMINACAO_PUBLICA'
  | 'TRANSITO'
  | 'LIMPEZA_URBANA'
  | 'SEGURANCA'
  | 'MEIO_AMBIENTE'
  | 'ACESSIBILIDADE'
  | 'OUTROS';

export type OccurrenceActorType = 'USER' | 'COMMUNITY' | 'RESPONSIBLE_AGENCY' | 'MODERATOR' | 'SYSTEM';

export type OccurrenceEventType =
  | 'OCORRENCIA_CRIADA'
  | 'OCCURRENCE_UPDATED'
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_REMOVED'
  | 'EVIDENCIA_ADICIONADA'
  | 'OCORRENCIA_CONFIRMADA'
  | 'ORGAO_RESPONSAVEL_IDENTIFICADO'
  | 'AGENCY_NOT_IDENTIFIED'
  | 'OCORRENCIA_ENCAMINHADA'
  | 'ENCAMINHAMENTO_FALHOU'
  | 'FORWARDING_RESPONSE_REGISTERED'
  | 'PROTOCOL_REGISTERED'
  | 'ANALISE_INICIADA'
  | 'RESOLUCAO_INFORMADA'
  | 'OCORRENCIA_RESOLVIDA'
  | 'RESOLUCAO_CONTESTADA'
  | 'OCORRENCIA_REABERTA'
  | 'MODERATION_APPLIED';

export interface OccurrenceEvidence {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'LINK' | 'OTHER';
  url?: string;
  description?: string;
  addedBy?: string;
  actorType?: OccurrenceActorType;
  addedAt: string;
  sourceInteractionId?: string;
}

export interface OccurrenceLocation {
  label: string;
  city?: string;
  state?: string;
  stateCode?: string;
  stateName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  cityId?: string;
  cityName?: string;
  neighborhoodId?: string;
  neighborhoodName?: string;
}

export interface OccurrenceAgency {
  id?: string;
  name: string;
  hasIntegration?: boolean;
  email?: string;
  phone?: string;
  website?: string;
}

export interface OccurrenceHistoryEvent {
  id: string;
  occurrenceId: string;
  eventType: OccurrenceEventType;
  actorId?: string;
  actorName?: string;
  actorType: OccurrenceActorType;
  actorOrigin?: string;
  occurredAt: string;
  createdAt?: string;
  description?: string;
  previousStatus?: OccurrenceStatus;
  newStatus?: OccurrenceStatus;
  metadata?: Record<string, unknown>;
  evidenceIds?: string[];
}

export type OccurrenceForwardingChannel =
  | 'INTEGRATION'
  | 'EMAIL'
  | 'PHONE'
  | 'WEBSITE'
  | 'IN_PERSON'
  | 'OTHER';

export interface OccurrenceForwarding {
  id: string;
  agency?: OccurrenceAgency;
  channel: OccurrenceForwardingChannel;
  sentAt: string;
  sentContent?: string;
  protocol?: string;
  responseReceived?: string;
  responsibleUserId?: string;
  success: boolean;
  failureReason?: string;
}

export interface SpectrumPost {
  id: string;
  createdAt: string;
  disliked: boolean;
  dislikes: number;
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
  dislikes: number;
  liked: boolean;
  disliked: boolean;
  comments: number;
  reposts: number;
  reposted: boolean;
  saved: boolean;
  tags: string[];
  originalPostId?: string;
  updatedAt?: string;
  status: OccurrenceStatus;
  importance: OccurrenceImportance;
  category?: OccurrenceCategory;
  location?: OccurrenceLocation;
  responsibleAgency?: OccurrenceAgency | null;
  evidences: OccurrenceEvidence[];
  forwardingHistory: OccurrenceForwarding[];
  confirmedByIds: string[];
  history: OccurrenceHistoryEvent[];
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
  category?: OccurrenceCategory;
  importance?: OccurrenceImportance;
  location?: OccurrenceLocation;
}

export interface CreateOccurrenceEvidencePayload {
  type: OccurrenceEvidence['type'];
  url: string;
  description?: string;
}

export interface CreateOccurrencePayload {
  text: string;
  title: string;
  description: string;
  category: OccurrenceCategory;
  importance: OccurrenceImportance;
  location: OccurrenceLocation;
  evidences: CreateOccurrenceEvidencePayload[];
  createdBy: string;
  cityId: string;
}

export interface UploadedEvidenceResponse {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  fileName: string;
  mimeType: string;
  size: number;
}

interface OccurrenceApiResponse {
  _id: string;
  text: string;
  title?: string;
  description?: string;
  category: OccurrenceCategory;
  importance: OccurrenceImportance;
  status: OccurrenceStatus;
  location: OccurrenceLocation;
  responsibleAgency?: OccurrenceAgency | null;
  evidences: OccurrenceEvidence[];
  forwardingHistory?: OccurrenceForwarding[];
  confirmedByIds?: string[];
  history: OccurrenceHistoryEvent[];
  createdBy: string;
  originalPostId?: string;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
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
  disliked?: boolean;
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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/post`;
  private readonly storageKey = 'spectrum-mock-posts';
  private readonly repostStorageKey = 'spectrum-reposts';
  private readonly postInteractionStorageKey = 'spectrum-post-interactions';
  private readonly commentInteractionStorageKey = 'spectrum-comment-interactions';

  createOccurrence(
    payload: CreateOccurrencePayload,
    user: LoggedUser,
  ): Observable<SpectrumPost> {
    return this.http.post<OccurrenceApiResponse>(this.apiUrl, payload).pipe(
      map((occurrence) => this.toSpectrumPost(occurrence, user)),
      tap((occurrence) => {
        const remainingPosts = this.getUserPosts().filter((post) => post.id !== occurrence.id);
        localStorage.setItem(this.storageKey, JSON.stringify([occurrence, ...remainingPosts]));
      }),
    );
  }

  uploadEvidence(file: File): Observable<UploadedEvidenceResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<UploadedEvidenceResponse>(`${this.apiUrl}/evidence/upload`, formData);
  }

  getOccurrence(id: string, user: LoggedUser | null): Observable<SpectrumPost> {
    if (!this.isApiId(id)) {
      throw new Error('O histórico está disponível apenas para ocorrências salvas no servidor.');
    }

    return this.http
      .get<OccurrenceApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  getOccurrenceHistory(id: string): Observable<OccurrenceHistoryEvent[]> {
    if (!this.isApiId(id)) {
      throw new Error('O histórico está disponível apenas para ocorrências salvas no servidor.');
    }
    return this.http.get<OccurrenceHistoryEvent[]>(`${this.apiUrl}/${id}/history`, {
      params: { _: Date.now().toString() },
    });
  }

  confirmOccurrence(post: SpectrumPost, user: LoggedUser | null): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para confirmar a ocorrência.');
    const payload = { actorId: userId, actorType: 'USER' as OccurrenceActorType };

    if (!this.isApiId(post.id)) {
      return of(
        this.updateLocalOccurrence(post.id, user, {
          eventType: 'OCORRENCIA_CONFIRMADA',
          metadata: { note: 'Também identifiquei este problema.' },
          confirmedById: userId,
        }),
      );
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/confirm`, payload)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  addOccurrenceEvidence(
    post: SpectrumPost,
    user: LoggedUser | null,
    evidence: Pick<OccurrenceEvidence, 'type' | 'url' | 'description'>,
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para adicionar evidências.');
    const actorType: OccurrenceActorType = user?.occurrenceRole === 'RESPONSIBLE_AGENCY'
      ? 'RESPONSIBLE_AGENCY'
      : user?.occurrenceRole === 'MODERATOR' ? 'MODERATOR' : 'USER';
    const payload = { ...evidence, actorId: userId, actorType };

    if (!this.isApiId(post.id)) {
      return of(this.addEvidence(post, user, evidence));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/evidence`, payload)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  identifyResponsibleAgency(
    post: SpectrumPost,
    user: LoggedUser | null,
    agency: OccurrenceAgency,
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para associar o órgão.');
    const actorType: OccurrenceActorType = user?.occurrenceRole === 'MODERATOR' ? 'MODERATOR' : 'USER';
    const payload = { agency, actorId: userId, actorType };

    if (!this.isApiId(post.id)) {
      return of(
        this.updateLocalOccurrence(post.id, user, {
          eventType: 'ORGAO_RESPONSAVEL_IDENTIFICADO',
          metadata: { agency },
          responsibleAgency: agency,
        }),
      );
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/agency`, payload)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  forwardOccurrence(
    post: SpectrumPost,
    user: LoggedUser | null,
    payload: {
      agency: OccurrenceAgency;
      channel: OccurrenceForwardingChannel;
      sentContent: string;
      protocol?: string;
      deliveryConfirmed?: boolean;
    },
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para encaminhar.');
    const actorType: OccurrenceActorType = user?.occurrenceRole === 'MODERATOR' ? 'MODERATOR' : 'USER';
    const body = { ...payload, actorId: userId, actorType };

    if (!this.isApiId(post.id)) {
      return of(
        this.updateLocalOccurrence(post.id, user, {
          status: 'ENCAMINHADA',
          eventType: 'OCORRENCIA_ENCAMINHADA',
          metadata: { forwarding: body },
          responsibleAgency: payload.agency,
          forwarding: {
            id: this.createLocalId('forwarding'),
            agency: payload.agency,
            channel: payload.channel,
            sentAt: new Date().toISOString(),
            sentContent: payload.sentContent,
            protocol: payload.protocol,
            responsibleUserId: userId,
            success: true,
          },
        }),
      );
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/forward`, body)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  registerForwardingFailure(
    post: SpectrumPost,
    user: LoggedUser | null,
    payload: {
      agency?: OccurrenceAgency;
      channel: OccurrenceForwardingChannel;
      sentContent?: string;
      failureReason: string;
    },
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para registrar a tentativa.');
    const actorType: OccurrenceActorType = user?.occurrenceRole === 'MODERATOR' ? 'MODERATOR' : 'USER';
    const body = { ...payload, actorId: userId, actorType };

    if (!this.isApiId(post.id)) {
      return of(
        this.updateLocalOccurrence(post.id, user, {
          eventType: 'ENCAMINHAMENTO_FALHOU',
          metadata: { failureReason: payload.failureReason },
          forwarding: {
            id: this.createLocalId('forwarding'),
            agency: payload.agency ?? post.responsibleAgency ?? undefined,
            channel: payload.channel,
            sentAt: new Date().toISOString(),
            sentContent: payload.sentContent,
            responsibleUserId: userId,
            success: false,
            failureReason: payload.failureReason,
          },
        }),
      );
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/forward/failure`, body)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  startOccurrenceAnalysis(
    post: SpectrumPost,
    user: LoggedUser | null,
    note: string,
    reference?: string,
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para iniciar análise.');
    const actorType: OccurrenceActorType = user?.occurrenceRole === 'RESPONSIBLE_AGENCY' ? 'RESPONSIBLE_AGENCY' : 'MODERATOR';
    const body = { note, reference, actorId: userId, actorType };

    if (!this.isApiId(post.id)) {
      return of(
        this.updateLocalOccurrence(post.id, user, {
          status: 'EM_ANALISE',
          eventType: 'ANALISE_INICIADA',
          actorType,
          metadata: { note },
        }),
      );
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/analysis`, body)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  informOccurrenceResolution(
    post: SpectrumPost,
    user: LoggedUser | null,
    statement: string,
    evidenceIds: string[] = [],
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para informar resolução.');
    const actorType: OccurrenceActorType = user?.occurrenceRole === 'RESPONSIBLE_AGENCY' ? 'RESPONSIBLE_AGENCY' : 'USER';
    const body = {
      statement,
      evidenceIds,
      actorId: userId,
      actorType,
    };

    if (!this.isApiId(post.id)) {
      return of(this.informResolution(post, user, statement));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/resolution`, body)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  resolveOccurrence(
    post: SpectrumPost,
    user: LoggedUser | null,
    note: string,
    evidenceIds: string[] = [],
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para resolver.');
    const actorType: OccurrenceActorType = user?.occurrenceRole === 'RESPONSIBLE_AGENCY' ? 'RESPONSIBLE_AGENCY' : 'MODERATOR';
    const body = {
      note,
      evidenceIds,
      actorId: userId,
      actorType,
    };

    if (!this.isApiId(post.id)) {
      return of(
        this.updateLocalOccurrence(post.id, user, {
          status: 'RESOLVIDA',
          eventType: 'OCORRENCIA_RESOLVIDA',
          actorType,
          metadata: { note, source: 'authorized_review' },
        }),
      );
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/resolve`, body)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  contestOccurrenceResolution(
    post: SpectrumPost,
    user: LoggedUser | null,
    reason: string,
    evidenceIds: string[] = [],
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para contestar.');
    const body = {
      reason,
      evidenceIds,
      actorId: userId,
      actorType: 'USER' as OccurrenceActorType,
    };

    if (!this.isApiId(post.id)) {
      return of(this.contestResolution(post, user, reason));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/contest`, body)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  reopenOccurrenceFlow(
    post: SpectrumPost,
    user: LoggedUser | null,
    reason: string,
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para reabrir.');
    const body = { reason, actorId: userId, actorType: 'USER' as OccurrenceActorType };

    if (!this.isApiId(post.id)) {
      return of(this.reopenOccurrence(post, user, reason));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/reopen`, body)
      .pipe(map((occurrence) => this.toSpectrumPost(occurrence, user)));
  }

  readonly suggestions: SuggestedProfile[] = [
    { name: 'Ana Martins', nickname: 'ana.martins', initial: 'A', verified: false },
    { name: 'Lucas Oliveira', nickname: 'lucas.oliveira', initial: 'L', verified: false },
    { name: 'Marina Costa', nickname: 'marina.costa', initial: 'M', verified: false },
    { name: 'Beatriz Lima', nickname: 'beatriz.lima', initial: 'B', verified: false },
  ];

  private readonly commentsByPost: Record<string, SpectrumComment[]> = {
    'mock-ana-1': [
      {
        id: 'c-ana-1',
        authorName: 'Beatriz Lima',
        authorInitial: 'B',
        content:
          'Passei por essa avenida ontem à noite e realmente está muito escuro. Principalmente perto do ponto de ônibus.',
        dateLabel: 'Há 38 min',
        likes: 6,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-ana-2',
        authorName: 'Gabriel Santos',
        authorInitial: 'G',
        content:
          'Seria importante registrar quais postes estão apagados. Isso pode facilitar bastante na hora de solicitar a manutenção.',
        dateLabel: 'Há 1h',
        likes: 4,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
    ],
    'mock-lucas-1': [
      {
        id: 'c-lucas-1',
        authorName: 'Marina Costa',
        authorInitial: 'M',
        content:
          'Esse tipo de problema acaba obrigando muita gente a andar pela rua. Para quem usa cadeira de rodas fica ainda mais complicado.',
        dateLabel: 'Há 2h',
        likes: 9,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-lucas-2',
        authorName: 'Rafael Nunes',
        authorInitial: 'R',
        content:
          'Também acho importante indicar exatamente o trecho afetado. Assim fica mais fácil acompanhar se houve alguma manutenção depois.',
        dateLabel: 'Há 3h',
        likes: 3,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
    ],
    'mock-marina-1': [
      {
        id: 'c-marina-1',
        authorName: 'Ana Martins',
        authorInitial: 'A',
        content:
          'Muito bom ver uma atualização positiva. Registrar quando o problema é resolvido ajuda a mostrar que houve uma mudança de verdade.',
        dateLabel: 'Há 5h',
        likes: 12,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-marina-2',
        authorName: 'Lucas Oliveira',
        authorInitial: 'L',
        content:
          'Tomara que façam o mesmo nos outros pontos da região. Ainda tem alguns trechos bem escuros por ali.',
        dateLabel: 'Há 6h',
        likes: 7,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
    ],
    'mock-gabriel-1': [
      {
        id: 'c-gabriel-1',
        authorName: 'Beatriz Lima',
        authorInitial: 'B',
        content:
          'Esse cruzamento já alagou outras vezes. Parece que o problema realmente está na drenagem e não só na quantidade de chuva.',
        dateLabel: 'Há 1d',
        likes: 15,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-gabriel-2',
        authorName: 'Ana Martins',
        authorInitial: 'A',
        content:
          'Em dias de chuva forte fica quase impossível passar a pé por esse trecho. Seria importante uma manutenção antes do próximo período de chuvas.',
        dateLabel: 'Há 1d',
        likes: 8,
        dislikes: 1,
        liked: false,
        disliked: false,
      },
    ],
    'mock-beatriz-1': [
      {
        id: 'c-beatriz-1',
        authorName: 'Gabriel Santos',
        authorInitial: 'G',
        content:
          'Também acho que esse cruzamento precisa de uma faixa. No horário de pico fica ainda mais difícil atravessar.',
        dateLabel: 'Há 2d',
        likes: 10,
        dislikes: 0,
        liked: false,
        disliked: false,
      },
      {
        id: 'c-beatriz-2',
        authorName: 'Marina Costa',
        authorInitial: 'M',
        content:
          'Uma faixa de pedestres junto com sinalização melhor já deixaria o local muito mais seguro.',
        dateLabel: 'Há 2d',
        likes: 6,
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
      dislikes: 0,
      liked: false,
      dislikes: 0,
      disliked: false,
      comments: 0,
      reposts: 0,
      reposted: false,
      saved: false,
      tags: payload.tags,
      status: 'ABERTA',
      category: payload.category ?? 'OUTROS',
      importance: payload.importance ?? 'MEDIA',
      location: payload.location ?? { label: payload.authorCity.trim() },
      evidences: this.createInitialEvidence(payload, user, now),
      forwardingHistory: [],
      confirmedByIds: [],
      history: [
        this.createHistoryEvent({
          occurrenceId: `local-${now.getTime()}`,
          eventType: 'OCORRENCIA_CRIADA',
          actorId: user?._id,
          actorType: 'USER',
          occurredAt: now.toISOString(),
          newStatus: 'ABERTA',
          metadata: {
            title: payload.title.trim(),
            location: payload.authorCity.trim(),
            source: 'community_claim',
          },
        }),
      ],
    };

    post.history = post.history.map((event) => ({
      ...event,
      occurrenceId: post.id,
    }));

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

    if (record.liked) {
      record.disliked = false;
    }

    this.savePostInteractionRecords(records);

    return this.withPostState(basePost, user);
  }

  togglePostDislike(post: SpectrumPost, user: LoggedUser | null): SpectrumPost {
    const userId = this.requireUserKey(user, 'Entre na sua conta para descurtir.');
    const postId = post.originalPostId ?? post.id;
    const basePost = this.findRawPost(postId) ?? this.withoutComputedPostState({ ...post, id: postId });
    const records = this.getPostInteractionRecords();
    const record = this.getOrCreatePostInteractionRecord(records, userId, postId);
    const currentPost = this.withPostState(basePost, user);

    record.disliked = !currentPost.disliked;

    if (record.disliked) {
      record.liked = false;
    }

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
      category: payload.category ?? posts[index].category,
      importance: payload.importance ?? posts[index].importance,
      location: payload.location ?? posts[index].location,
      updatedAt: new Date().toISOString(),
      history: [
        ...(posts[index].history ?? []),
        this.createHistoryEvent({
          occurrenceId: posts[index].id,
          eventType: 'OCCURRENCE_UPDATED',
          actorId: user?._id,
          actorType: 'USER',
          previousStatus: posts[index].status,
          newStatus: posts[index].status,
          metadata: {
            changedFields: [
              'title',
              'content',
              'authorCity',
              'mediaType',
              'tags',
              'category',
              'importance',
              'location',
            ],
          },
        }),
      ],
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

  addEvidence(
    post: SpectrumPost,
    user: LoggedUser | null,
    evidence: Pick<OccurrenceEvidence, 'type' | 'url' | 'description'>,
  ): SpectrumPost {
    return this.updateLocalOccurrence(post.id, user, {
      eventType: 'EVIDENCIA_ADICIONADA',
      metadata: {
        evidence,
      },
      evidence: {
        ...evidence,
        id: this.createLocalId('evidence'),
        addedBy: this.getUserKey(user) || undefined,
        actorType: 'USER',
        addedAt: new Date().toISOString(),
      },
    });
  }

  informResolution(post: SpectrumPost, user: LoggedUser | null, statement: string): SpectrumPost {
    return this.updateLocalOccurrence(post.id, user, {
      status: 'RESOLUCAO_INFORMADA',
      eventType: 'RESOLUCAO_INFORMADA',
      metadata: {
        statement,
        source: 'community_claim',
      },
    });
  }

  contestResolution(post: SpectrumPost, user: LoggedUser | null, reason: string): SpectrumPost {
    return this.updateLocalOccurrence(post.id, user, {
      status: 'CONTESTADA',
      eventType: 'RESOLUCAO_CONTESTADA',
      metadata: {
        reason,
      },
    });
  }

  reopenOccurrence(post: SpectrumPost, user: LoggedUser | null, reason: string): SpectrumPost {
    return this.updateLocalOccurrence(post.id, user, {
      status: 'REABERTA',
      eventType: 'OCORRENCIA_REABERTA',
      actorType: 'MODERATOR',
      metadata: {
        reason,
      },
    });
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

  getStatusLabel(status: OccurrenceStatus): string {
    const labels: Record<OccurrenceStatus, string> = {
      ABERTA: 'Aberta',
      ENCAMINHADA: 'Encaminhada',
      EM_ANALISE: 'Em análise',
      RESOLUCAO_INFORMADA: 'Resolução informada',
      RESOLVIDA: 'Resolvida',
      CONTESTADA: 'Contestada',
      REABERTA: 'Reaberta',
      SEM_ORGAO_IDENTIFICADO: 'Sem órgão identificado',
    };

    return labels[status];
  }

  getImportanceLabel(importance: OccurrenceImportance): string {
    const labels: Record<OccurrenceImportance, string> = {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      CRITICA: 'Crítica',
    };

    return labels[importance];
  }

  getCategoryLabel(category?: OccurrenceCategory): string {
    const labels: Record<OccurrenceCategory, string> = {
      INFRAESTRUTURA: 'Infraestrutura',
      ILUMINACAO_PUBLICA: 'Iluminação pública',
      TRANSITO: 'Trânsito',
      LIMPEZA_URBANA: 'Limpeza urbana',
      SEGURANCA: 'Segurança',
      MEIO_AMBIENTE: 'Meio ambiente',
      ACESSIBILIDADE: 'Acessibilidade',
      OUTROS: 'Outros',
    };

    return category ? labels[category] : labels.OUTROS;
  }

  private updateLocalOccurrence(
    id: string,
    user: LoggedUser | null,
    update: {
      status?: OccurrenceStatus;
      eventType: OccurrenceEventType;
      actorType?: OccurrenceActorType;
      metadata?: Record<string, unknown>;
      evidence?: OccurrenceEvidence;
      confirmedById?: string;
      responsibleAgency?: OccurrenceAgency | null;
      forwarding?: OccurrenceForwarding;
    },
  ): SpectrumPost {
    const posts = this.getUserPosts();
    const index = posts.findIndex((item) => item.id === id);

    if (index < 0) {
      throw new Error('Somente ocorrencias locais podem ser atualizadas neste modo.');
    }

    const currentPost = this.normalizePost(posts[index]);
    const nextStatus = update.status ?? currentPost.status;
    const confirmedByIds = update.confirmedById
      ? [...new Set([...currentPost.confirmedByIds, update.confirmedById])]
      : currentPost.confirmedByIds;

    const updatedPost: SpectrumPost = {
      ...currentPost,
      status: nextStatus,
      responsibleAgency:
        update.responsibleAgency !== undefined
          ? update.responsibleAgency
          : currentPost.responsibleAgency,
      evidences: update.evidence
        ? [...currentPost.evidences, update.evidence]
        : currentPost.evidences,
      forwardingHistory: update.forwarding
        ? [...currentPost.forwardingHistory, update.forwarding]
        : currentPost.forwardingHistory,
      confirmedByIds,
      history: [
        ...currentPost.history,
        this.createHistoryEvent({
          occurrenceId: currentPost.id,
          eventType: update.eventType,
          actorId: this.getUserKey(user) || undefined,
          actorType: update.actorType ?? 'USER',
          previousStatus: currentPost.status,
          newStatus: nextStatus,
          metadata: update.metadata,
          evidenceIds: update.evidence ? [update.evidence.id] : undefined,
        }),
      ],
      updatedAt: new Date().toISOString(),
    };

    posts[index] = this.withoutComputedPostState(updatedPost);
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
    return this.withPostState(updatedPost, user);
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
      id: 'mock-ana-1',
      createdAt: '2026-09-16T17:42:00.000Z',
      authorName: 'Ana Martins',
      authorNickname: 'ana.martins',
      authorInitial: 'A',
      authorCity: 'São Paulo - SP',
      title: 'Iluminação pública apagada há vários dias',
      content:
        'Os postes de uma parte da Avenida Central estão apagados há quase uma semana. Durante a noite o trecho fica muito escuro, principalmente perto do ponto de ônibus. Alguém sabe se já existe alguma solicitação de manutenção para essa região?',
      mediaType: 'text',
      publishedAt: '2026-09-16T17:42:00.000Z',
      publishedAtLabel: 'Publicado em 16/09/2026, às 14:42',
      likes: 38,
      liked: false,
      dislikes: 0,
      disliked: false,
      comments: 11,
      reposts: 4,
      reposted: false,
      saved: false,
      tags: ['iluminação', 'segurança', 'infraestrutura'],
      status: 'ENCAMINHADA',
      category: 'ILUMINACAO_PUBLICA',
      importance: 'ALTA',
      responsibleAgency: {
        name: 'Secretaria Municipal de Iluminacao Publica',
        hasIntegration: false,
        email: 'atendimento@prefeitura.example',
      },
      evidences: [],
      forwardingHistory: [],
      confirmedByIds: [],
      history: [],
    },
    {
      id: 'mock-lucas-1',
      createdAt: '2026-09-15T21:18:00.000Z',
      authorName: 'Lucas Oliveira',
      authorNickname: 'lucas.oliveira',
      authorInitial: 'L',
      authorCity: 'Guarulhos - SP',
      title: 'Calçada sem acessibilidade perto do terminal',
      content:
        'Tem um trecho perto do terminal em que a calçada está muito danificada e praticamente impossível de utilizar com cadeira de rodas ou carrinho de bebê. Em alguns pontos as pessoas acabam precisando andar pela rua. Seria importante uma manutenção nesse local.',
      mediaType: 'image',
      publishedAt: '2026-09-15T21:18:00.000Z',
      publishedAtLabel: 'Publicado em 15/09/2026, às 18:18',
      likes: 64,
      liked: false,
      dislikes: 0,
      disliked: false,
      comments: 19,
      reposts: 7,
      reposted: false,
      saved: false,
      tags: ['acessibilidade', 'calçada', 'mobilidade'],
      status: 'ABERTA',
      category: 'ACESSIBILIDADE',
      importance: 'ALTA',
      evidences: [],
      forwardingHistory: [],
      confirmedByIds: [],
      history: [],
    },
    {
      id: 'mock-marina-1',
      createdAt: '2026-09-14T23:07:00.000Z',
      authorName: 'Marina Costa',
      authorNickname: 'marina.costa',
      authorInitial: 'M',
      authorCity: 'Recife - PE',
      title: 'A iluminação do ponto finalmente foi consertada',
      content:
        'Há algumas semanas publiquei aqui sobre a falta de iluminação perto do ponto de ônibus. Ontem instalaram novas lâmpadas e o local ficou muito melhor durante a noite. É importante registrar os problemas, mas também mostrar quando eles são resolvidos.',
      mediaType: 'text',
      publishedAt: '2026-09-14T23:07:00.000Z',
      publishedAtLabel: 'Publicado em 14/09/2026, às 20:07',
      likes: 51,
      liked: false,
      dislikes: 0,
      disliked: false,
      comments: 8,
      reposts: 3,
      reposted: false,
      saved: true,
      tags: ['iluminação', 'resultado', 'melhoria'],
      status: 'RESOLUCAO_INFORMADA',
      category: 'ILUMINACAO_PUBLICA',
      importance: 'MEDIA',
      responsibleAgency: {
        name: 'Departamento de Iluminacao Publica',
        hasIntegration: true,
      },
      evidences: [],
      forwardingHistory: [],
      confirmedByIds: [],
      history: [],
    },
    {
      id: 'mock-gabriel-1',
      createdAt: '2026-09-13T15:26:00.000Z',
      authorName: 'Gabriel Santos',
      authorNickname: 'gabriel.santos',
      authorInitial: 'G',
      authorCity: 'Campinas - SP',
      title: 'Alagamento volta a acontecer depois da chuva',
      content:
        'Depois da chuva de hoje, o cruzamento da Avenida das Flores voltou a ficar completamente alagado. Esse problema acontece praticamente toda vez que chove mais forte e dificulta bastante a passagem de carros e pedestres. Parece que a drenagem do local precisa de manutenção.',
      mediaType: 'image',
      publishedAt: '2026-09-13T15:26:00.000Z',
      publishedAtLabel: 'Publicado em 13/09/2026, às 12:26',
      likes: 72,
      liked: false,
      dislikes: 0,
      disliked: false,
      comments: 24,
      reposts: 9,
      reposted: false,
      saved: false,
      tags: ['alagamento', 'drenagem', 'infraestrutura'],
      status: 'REABERTA',
      category: 'INFRAESTRUTURA',
      importance: 'CRITICA',
      responsibleAgency: {
        name: 'Secretaria de Obras e Drenagem',
        hasIntegration: false,
      },
      evidences: [],
      forwardingHistory: [],
      confirmedByIds: [],
      history: [],
    },
    {
      id: 'mock-beatriz-1',
      createdAt: '2026-09-11T19:53:00.000Z',
      authorName: 'Beatriz Lima',
      authorNickname: 'beatriz.lima',
      authorInitial: 'B',
      authorCity: 'São Paulo - SP',
      title: 'Faixa de pedestres faria diferença neste cruzamento',
      content:
        'Esse cruzamento tem bastante movimento durante o dia, mas não existe nenhuma faixa de pedestres próxima. Nos horários de pico fica difícil atravessar com segurança. Acho que uma faixa e uma sinalização melhor já ajudariam bastante quem passa por aqui diariamente.',
      mediaType: 'text',
      publishedAt: '2026-09-11T19:53:00.000Z',
      publishedAtLabel: 'Publicado em 11/09/2026, às 16:53',
      likes: 43,
      liked: false,
      dislikes: 0,
      disliked: false,
      comments: 9,
      reposts: 4,
      reposted: false,
      saved: false,
      tags: ['trânsito', 'pedestres', 'sinalização'],
      status: 'SEM_ORGAO_IDENTIFICADO',
      category: 'TRANSITO',
      importance: 'MEDIA',
      evidences: [],
      forwardingHistory: [],
      confirmedByIds: [],
      history: [],
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
      dislikes: normalizedPost.dislikes + postInteractions.filter((record) => record.disliked).length,
      liked: currentUserInteraction?.liked ?? false,
      disliked: currentUserInteraction?.disliked ?? false,
      saved: currentUserInteraction?.saved ?? normalizedPost.saved,
      reposts: normalizedPost.reposts + reposts.length,
      reposted: userId ? reposts.some((repost) => repost.userId === userId) : false,
    };
  }

  private normalizePost(post: SpectrumPost): SpectrumPost {
    const postWithLegacyShares = post as SpectrumPost & { shares?: number };
    const createdAt = post.createdAt || post.publishedAt;
    const normalizedStatus = post.status ?? 'ABERTA';

    return {
      ...post,
      createdAt,
      likes: post.likes ?? 0,
      liked: post.liked ?? false,
      dislikes: post.dislikes ?? 0,
      disliked: post.disliked ?? false,
      reposts: post.reposts ?? postWithLegacyShares.shares ?? 0,
      reposted: post.reposted ?? false,
      status: normalizedStatus,
      category: post.category ?? 'OUTROS',
      importance: post.importance ?? 'MEDIA',
      location: post.location ?? { label: post.authorCity },
      evidences: post.evidences ?? [],
      forwardingHistory: post.forwardingHistory ?? [],
      confirmedByIds: post.confirmedByIds ?? [],
      history:
        post.history?.length
          ? post.history
          : [
              this.createHistoryEvent({
                occurrenceId: post.id,
                eventType: 'OCORRENCIA_CRIADA',
                actorId: post.createdBy,
                actorType: 'USER',
                occurredAt: createdAt,
                newStatus: normalizedStatus,
                metadata: {
                  title: post.title,
                  location: post.authorCity,
                  source: 'legacy_post',
                },
              }),
            ],
    };
  }

  private withoutComputedPostState(post: SpectrumPost): SpectrumPost {
    const postId = post.originalPostId ?? post.id;

    const interactionLikes = this.getPostInteractionRecords().filter(
      (record) => record.postId === postId && record.liked,
    ).length;

    const interactionDislikes = this.getPostInteractionRecords().filter(
      (record) => record.postId === postId && record.disliked,
    ).length;

    const reposts = this.getRepostRecords().filter(
      (repost) => repost.originalPostId === postId,
    ).length;

    return {
      ...post,
      likes: Math.max(0, post.likes - interactionLikes),
      dislikes: Math.max(0, post.dislikes - interactionDislikes),
      liked: false,
      disliked: false,
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

  private createInitialEvidence(
    payload: CreatePostPayload,
    user: LoggedUser | null,
    now: Date,
  ): OccurrenceEvidence[] {
    if (payload.mediaType === 'text') {
      return [];
    }

    return [
      {
        id: this.createLocalId('evidence'),
        type: payload.mediaType === 'video' ? 'VIDEO' : 'IMAGE',
        description: payload.mediaType === 'video' ? 'Video anexado' : 'Imagem anexada',
        addedBy: this.getUserKey(user) || undefined,
        actorType: 'USER',
        addedAt: now.toISOString(),
      },
    ];
  }

  private toSpectrumPost(
    occurrence: OccurrenceApiResponse,
    user: LoggedUser | null,
  ): SpectrumPost {
    const createdAt = occurrence.createdAt || new Date().toISOString();
    const primaryEvidence = occurrence.evidences?.[0];
    const mediaType: SpectrumPost['mediaType'] =
      primaryEvidence?.type === 'VIDEO'
        ? 'video'
        : primaryEvidence?.type === 'IMAGE'
          ? 'image'
          : 'text';
    const authorName = user?.name || 'Usuario Spectrum';

return {
  id: occurrence._id,
  createdAt,
  createdBy: occurrence.createdBy,
  originalPostId: occurrence.originalPostId,
  authorName,
  authorNickname: user?.nickname || 'spectrum',
  authorInitial: authorName.charAt(0).toUpperCase(),
  authorCity: occurrence.location.label,
  title: occurrence.title || occurrence.text,
  content: occurrence.description || occurrence.text,
  mediaType,
  publishedAt: createdAt,
  publishedAtLabel: this.formatPublishedAt(new Date(createdAt)),
  likes: occurrence.likeCount ?? 0,
  liked: false,
  dislikes: 0,
  disliked: false,
  comments: 0,
  reposts: 0,
  reposted: false,
  saved: false,
  tags: [],
  status: occurrence.status,
  category: occurrence.category,
  importance: occurrence.importance,
  location: occurrence.location,
  responsibleAgency: occurrence.responsibleAgency,
  evidences: occurrence.evidences ?? [],
  forwardingHistory: occurrence.forwardingHistory ?? [],
  confirmedByIds: occurrence.confirmedByIds ?? [],
  history: occurrence.history ?? [],
  updatedAt: occurrence.updatedAt,
};
  }

  private createHistoryEvent(
    event: Omit<OccurrenceHistoryEvent, 'id' | 'occurredAt'> & {
      occurredAt?: string;
    },
  ): OccurrenceHistoryEvent {
    return {
      ...event,
      id: this.createLocalId('event'),
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    };
  }

  private createLocalId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private isApiId(id: string): boolean {
    return /^[a-f\d]{24}$/i.test(id);
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

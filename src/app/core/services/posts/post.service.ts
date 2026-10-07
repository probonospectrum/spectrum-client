import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';
import { occurrenceStage, OCCURRENCE_STATUS_DETAILS } from './occurrence-flow';
import { LoggedUser, UserService } from '../user/user.service';

export type OccurrenceStatus =
  | 'AGUARDANDO_ENCAMINHAMENTO'
  | 'EM_ANALISE_DE_COMPETENCIA'
  | 'FALHA_NO_ENCAMINHAMENTO'
  | 'RESPOSTA_EM_APURACAO'
  | 'EM_RESOLUCAO'
  | 'REJEITADA'
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
  | 'ANALISE_DE_COMPETENCIA_INICIADA'
  | 'MODERACAO_NECESSARIA'
  | 'OCORRENCIA_REENVIADA'
  | 'RESPOSTA_CLASSIFICADA'
  | 'OCORRENCIA_CRIADA'
  | 'OCCURRENCE_UPDATED'
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_REMOVED'
  | 'EVIDENCIA_ADICIONADA'
  | 'OCORRENCIA_CONFIRMADA'
  | 'ORGAO_RESPONSAVEL_IDENTIFICADO'
  | 'ORGAO_RESPONSAVEL_SUGERIDO'
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
  moderationReason?: string | null;
  forwardingDueAt?: string | null;
  id: string;
  createdAt: string;
  createdBy?: string;
  authorName: string;
  authorNickname: string;
  authorInitial: string;
  authorCity: string;
  authorAvatarUrl?: string;
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
  authorId?: string;
  authorName: string;
  authorInitial: string;
  content: string;
  dateLabel: string;
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
}

interface CommentApiResponse {
  _id: string;
  userId: string;
  text: string;
  createdAt: string;
  likeCount?: number;
  unlikeCount?: number;
  author: { name: string; nickname: string; avatarUrl?: string };
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
  author?: { _id: string; name: string; nickname: string; avatarUrl?: string; cityUser: string };
  unlikeCount?: number;
  moderationReason?: string | null;
  forwardingDueAt?: string | null;
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

export interface FeedPage {
  data: SpectrumPost[];
  nextCursor: string | null;
  hasMore: boolean;
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
  getModerationOccurrences(user: LoggedUser | null): Observable<SpectrumPost[]> {
    return this.http.get<OccurrenceApiResponse[]>(`${this.apiUrl}/moderation/occurrences`).pipe(
      map(items => items.map(item => this.toSpectrumPost(item, user))),
    );
  }
  updateOccurrence(post: SpectrumPost, payload: CreatePostPayload, user: LoggedUser | null, evidences: CreateOccurrenceEvidencePayload[] = []): Observable<SpectrumPost> {
    if (!this.canModifyPost(post, user)) throw new Error('O período de edição de 15 minutos foi encerrado.');
    if (!this.isApiId(post.id)) return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    return this.http.patch<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}`, {
      text: payload.content, description: payload.content, title: payload.title,
      category: payload.category, importance: payload.importance, location: payload.location, evidences,
    }).pipe(map(occurrence => this.toSpectrumPost(occurrence, user)), tap(updated => this.cacheOccurrence(updated)));
  }

  registerForwardingResponse(post: SpectrumPost, user: LoggedUser | null, forwardingId: string, responseReceived: string, responseCode: string, protocol: string): Observable<SpectrumPost> {
    this.assertTransition(post, user?.occurrenceRole === 'MODERATOR' || this.isRelatedAgency(post, user), ['ENCAMINHADA', 'EM_RESOLUCAO', 'RESPOSTA_EM_APURACAO', 'FALHA_NO_ENCAMINHAMENTO']);
    if (!this.isApiId(post.id)) throw new Error('O registro de resposta exige uma ocorrência salva no servidor.');
    return this.http.post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/forward/response`, {
      forwardingId, responseReceived, responseCode: responseCode || undefined, protocol: protocol.trim() || undefined,
    }).pipe(map(occurrence => this.toSpectrumPost(occurrence, user)), tap(updated => this.cacheOccurrence(updated)));
  }
  getRegisteredAgencies(): Observable<{ _id: string; name: string; emails: string[] }[]> {
    return this.http.get<{ _id: string; name: string; emails: string[] }[]>(`${this.apiUrl}/agencies`);
  }

  reviewForwardingResponse(post: SpectrumPost, user: LoggedUser | null, responseCode: string, note: string): Observable<SpectrumPost> {
    this.assertTransition(post, user?.occurrenceRole === 'MODERATOR', ['RESPOSTA_EM_APURACAO', 'RESOLUCAO_INFORMADA']);
    return this.http.post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/forward/response/review`, { responseCode, note }).pipe(
      map(occurrence => this.toSpectrumPost(occurrence, user)), tap(updated => this.cacheOccurrence(updated)),
    );
  }
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/post`;
  private readonly users = inject(UserService);
  private get storageKey(): string { return `spectrum-server-posts:${this.users.currentUser()?._id ?? 'anonymous'}`; }
  private readonly repostStorageKey = 'spectrum-reposts';
  private readonly postInteractionStorageKey = 'spectrum-post-interactions';
  private readonly commentInteractionStorageKey = 'spectrum-comment-interactions';

  getFeed(user: LoggedUser | null, cursor?: string): Observable<FeedPage> {
    return this.http.get<{ data: OccurrenceApiResponse[]; nextCursor: string | null; hasMore: boolean }>(`${API_BASE_URL}/feed`, {
      params: { scope: 'all', limit: '20', ...(cursor ? { cursor } : {}) },
    }).pipe(map((page) => ({ ...page, data: page.data.map((post) => this.withPostState(this.toSpectrumPost(post, user), user)) })),
      tap((page) => {
        page.data.forEach((post) => this.cacheOccurrence(post));
        const authors = new Map(page.data.filter((post) => post.createdBy !== user?._id).map((post) => [post.authorNickname, {
          name: post.authorName, nickname: post.authorNickname, initial: post.authorInitial, verified: false,
        }]));
        this.suggestions.splice(0, this.suggestions.length, ...Array.from(authors.values()).slice(0, 5));
      }));
  }

  getAuthorPosts(author: Pick<LoggedUser, '_id' | 'name' | 'nickname' | 'cityUser' | 'avatarUrl'>, viewer: LoggedUser | null): Observable<SpectrumPost[]> {
    return this.http.get<OccurrenceApiResponse[]>(`${this.apiUrl}/user/${author._id}`, { params: { limit: '50' } }).pipe(
      map((posts) => posts.map((post) => this.withPostState(this.toSpectrumPost({ ...post, author: {
        _id: author._id, name: author.name, nickname: author.nickname, cityUser: author.cityUser ?? '', avatarUrl: author.avatarUrl,
      } }, viewer), viewer))), tap((posts) => posts.forEach((post) => this.cacheOccurrence(post))),
    );
  }

  removeServerPost(post: SpectrumPost): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${post.id}`);
  }

  toggleServerRepost(post: SpectrumPost, user: LoggedUser | null): Observable<RepostToggleResult> {
    return this.http.post<{ post: OccurrenceApiResponse; reposted: boolean }>(`${this.apiUrl}/${post.id}/repost/toggle`, {}).pipe(
      map((result) => ({ post: { ...this.toSpectrumPost(result.post, user), reposted: result.reposted }, reposted: result.reposted })),
    );
  }

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
      return throwError(() => new Error('Ocorrência não encontrada.'));
    }

    return this.http
      .get<OccurrenceApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  getOccurrenceHistory(id: string): Observable<OccurrenceHistoryEvent[]> {
    if (!this.isApiId(id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http.get<OccurrenceHistoryEvent[]>(`${this.apiUrl}/${id}/history`, {
      params: { _: Date.now().toString() },
    });
  }

  confirmOccurrence(post: SpectrumPost, user: LoggedUser | null): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para confirmar a ocorrência.');
    const payload = { note: 'Também identifiquei este problema.' };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/confirm`, { ...payload, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  addOccurrenceEvidence(
    post: SpectrumPost,
    user: LoggedUser | null,
    evidence: Pick<OccurrenceEvidence, 'type' | 'url' | 'description'>,
  ): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para adicionar evidências.');
    const payload = { ...evidence };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/evidence`, { ...payload, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  identifyResponsibleAgency(
    post: SpectrumPost,
    user: LoggedUser | null,
    agency: OccurrenceAgency,
  ): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para associar o órgão.');
    const payload = { agency };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/agency`, { ...payload, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  suggestResponsibleAgency(
    post: SpectrumPost,
    user: LoggedUser | null,
    agency: OccurrenceAgency,
  ): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para sugerir o órgão.');
    const payload = { agency };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/agency/suggestion`, { ...payload, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  assumeAgencyResponsibility(post: SpectrumPost, user: LoggedUser | null): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para assumir responsabilidade.');

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/agency/assume`, {})
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
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
    const body = { ...payload };
    this.assertTransition(post, user?.occurrenceRole === 'MODERATOR', ['AGUARDANDO_ENCAMINHAMENTO', 'EM_ANALISE_DE_COMPETENCIA', 'FALHA_NO_ENCAMINHAMENTO', 'ABERTA', 'SEM_ORGAO_IDENTIFICADO']);
    if (payload.channel !== 'EMAIL' || !payload.agency.id) throw new Error('Selecione um órgão cadastrado para envio por e-mail.');
    if (!this.isApiId(post.id)) throw new Error('O envio por e-mail exige uma ocorrência salva no servidor.');

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/forward`, { ...body, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
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
    const body = { ...payload };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/forward/failure`, { ...body, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  startOccurrenceAnalysis(
    post: SpectrumPost,
    user: LoggedUser | null,
    note: string,
    reference?: string,
  ): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para iniciar análise.');
    const actorType = this.actorTypeForUser(user);
    const body = { note, reference };
    this.assertTransition(post, this.isRelatedAgency(post, user), ['ENCAMINHADA']);
    if (note.trim().length < 20) throw new Error('Descreva a ação iniciada em pelo menos 20 caracteres.');

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/analysis`, { ...body, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  informOccurrenceResolution(
    post: SpectrumPost,
    user: LoggedUser | null,
    statement: string,
    evidenceIds: string[] = [],
  ): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para informar resolução.');
    this.assertTransition(post, (user?.occurrenceRole ?? 'USER') === 'USER' || this.isRelatedAgency(post, user), ['AGUARDANDO_ENCAMINHAMENTO', 'ABERTA', 'ENCAMINHADA', 'EM_ANALISE', 'EM_RESOLUCAO', 'REABERTA']);
    if (!statement.trim()) throw new Error('Descreva a solução observada.');
    const actorType = this.actorTypeForUser(user);
    const body = {
      statement,
      evidenceIds,
    };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/resolution`, { ...body, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  resolveOccurrence(
    post: SpectrumPost,
    user: LoggedUser | null,
    note: string,
    evidenceIds: string[] = [],
  ): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para resolver.');
    this.assertTransition(post, user?.occurrenceRole === 'MODERATOR', ['RESOLUCAO_INFORMADA', 'RESPOSTA_EM_APURACAO']);
    if (note.trim().length < 20) throw new Error('Descreva a verificação em pelo menos 20 caracteres.');
    const actorType = this.actorTypeForUser(user);
    const body = {
      note,
      evidenceIds,
    };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/resolve`, { ...body, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  contestOccurrenceResolution(
    post: SpectrumPost,
    user: LoggedUser | null,
    reason: string,
    evidenceIds: string[] = [],
  ): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para contestar.');
    this.assertTransition(post, (user?.occurrenceRole ?? 'USER') === 'USER', ['RESOLVIDA']);
    if (!reason.trim()) throw new Error('Explique por que o problema continua.');
    const body = {
      reason,
      evidenceIds,
    };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/contest`, { ...body, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  reopenOccurrenceFlow(
    post: SpectrumPost,
    user: LoggedUser | null,
    reason: string,
  ): Observable<SpectrumPost> {
    this.requireUserKey(user, 'Entre na sua conta para reabrir.');
    this.assertTransition(post, (user?.occurrenceRole ?? 'USER') === 'USER', ['CONTESTADA']);
    if (!reason.trim()) throw new Error('Informe o motivo da reabertura.');
    const body = { reason };

    if (!this.isApiId(post.id)) {
      return throwError(() => new Error('A ocorrência precisa estar salva no servidor.'));
    }

    return this.http
      .post<OccurrenceApiResponse>(`${this.apiUrl}/${post.id}/reopen`, { ...body, actorType: this.actorTypeForUser(user) })
      .pipe(
        map((occurrence) => this.toSpectrumPost(occurrence, user)),
        tap((post) => this.cacheOccurrence(post)),
      );
  }

  readonly suggestions: SuggestedProfile[] = [];
  private readonly commentsByPost: Record<string, SpectrumComment[]> = {};

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

  loadComments(postId: string): Observable<SpectrumComment[]> {
    return this.http.get<CommentApiResponse[]>(`${API_BASE_URL}/comment/post/${postId}`).pipe(map((comments) => comments.map((comment) => this.toComment(comment))));
  }

  createComment(postId: string, content: string, user: LoggedUser): Observable<SpectrumComment> {
    return this.http.post<CommentApiResponse>(`${API_BASE_URL}/comment`, { postId, text: content, userId: user._id }).pipe(map((comment) => this.toComment(comment)));
  }

  private toComment(comment: CommentApiResponse): SpectrumComment {
    return { id: comment._id, authorId: comment.userId, authorName: comment.author.name,
      authorInitial: comment.author.name.charAt(0).toUpperCase(), content: comment.text,
      dateLabel: this.formatPublishedAt(new Date(comment.createdAt)), likes: comment.likeCount ?? 0,
      dislikes: comment.unlikeCount ?? 0, liked: false, disliked: false };
  }

  createPost(payload: CreatePostPayload, user: LoggedUser | null): SpectrumPost {
    const now = new Date();
    const authorName = user?.name || 'Usuário Spectrum';
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
      disliked: false,
      comments: 0,
      reposts: 0,
      reposted: false,
      saved: false,
      tags: payload.tags,
      status: 'AGUARDANDO_ENCAMINHAMENTO',
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
          newStatus: 'AGUARDANDO_ENCAMINHAMENTO',
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

  setPostReaction(post: SpectrumPost, user: LoggedUser | null, reaction: 'LIKE' | 'UNLIKE' | null): Observable<SpectrumPost> {
    const userId = this.requireUserKey(user, 'Entre na sua conta para reagir.');
    const postId = post.originalPostId ?? post.id;
    return this.http.put<{ likes: number; dislikes: number; liked: boolean; disliked: boolean }>(
      `${API_BASE_URL}/like/post/${postId}`, { reaction },
    ).pipe(map(result => {
      const records = this.getPostInteractionRecords();
      const record = this.getOrCreatePostInteractionRecord(records, userId, postId);
      record.liked = result.liked;
      record.disliked = result.disliked;
      this.savePostInteractionRecords(records);
      const updated = { ...post, ...result };
      this.cacheOccurrence({ ...updated, id: postId });
      return updated;
    }));
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
        actorType: this.actorTypeForUser(user),
        addedAt: new Date().toISOString(),
      },
    });
  }

  informResolution(post: SpectrumPost, user: LoggedUser | null, statement: string): SpectrumPost {
    return this.updateLocalOccurrence(post.id, user, {
      status: 'RESOLUCAO_INFORMADA',
      eventType: 'RESOLUCAO_INFORMADA',
      actorType: this.actorTypeForUser(user),
      metadata: {
        statement,
        source: this.actorTypeForUser(user) === 'RESPONSIBLE_AGENCY' ? 'agency' : 'community',
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
      actorType: this.actorTypeForUser(user),
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

    return this.isOwnPost(post, user) && now - createdAt < POST_EDIT_WINDOW_MS;
  }

  isOwnPost(post: SpectrumPost, user: LoggedUser | null): boolean {
    if (!user) {
      return false;
    }

    return post.createdBy === user._id || post.authorNickname === user.nickname;
  }

  getStatusLabel(status: OccurrenceStatus): string {
    return OCCURRENCE_STATUS_DETAILS[status] ?? status;
  }

  getImportanceLabel(importance: OccurrenceImportance): string {
    const labels: Record<OccurrenceImportance, string> = {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      CRITICA: 'Alta',
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
          actorName: user?.name,
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
      return (JSON.parse(rawPosts) as SpectrumPost[]).filter((post) => this.isApiId(post.id)).map((post) => this.normalizePost(post));
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
    return [];
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
      likes: normalizedPost.likes + (this.isApiId(originalPostId) ? 0 : postInteractions.filter((record) => record.liked).length),
      dislikes: normalizedPost.dislikes + (this.isApiId(originalPostId) ? 0 : postInteractions.filter((record) => record.disliked).length),
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
      likes: Math.max(0, post.likes - (this.isApiId(postId) ? 0 : interactionLikes)),
      dislikes: Math.max(0, post.dislikes - (this.isApiId(postId) ? 0 : interactionDislikes)),
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
    const cached = this.getUserPosts().find((post) => post.id === occurrence._id);
    const creation = occurrence.history?.find((event) => event.eventType === 'OCORRENCIA_CRIADA');
    const isAuthor = user?._id === occurrence.createdBy;
    const authorName = occurrence.author?.name || creation?.actorName || cached?.authorName || (isAuthor ? user?.name : '') || 'Usuário Spectrum';

return {
  id: occurrence._id,
  createdAt,
  createdBy: occurrence.createdBy,
  originalPostId: occurrence.originalPostId,
  authorName,
  authorNickname: occurrence.author?.nickname || cached?.authorNickname || (isAuthor ? user?.nickname : '') || '',
  authorAvatarUrl: occurrence.author?.avatarUrl || cached?.authorAvatarUrl,
  authorInitial: authorName.charAt(0).toUpperCase(),
  authorCity: occurrence.author?.cityUser || occurrence.location?.label || '',
  title: occurrence.title || occurrence.text,
  content: occurrence.description || occurrence.text,
  mediaType,
  publishedAt: createdAt,
  publishedAtLabel: this.formatPublishedAt(new Date(createdAt)),
  likes: occurrence.likeCount ?? 0,
  liked: false,
  dislikes: occurrence.unlikeCount ?? 0,
  disliked: false,
  comments: 0,
  reposts: 0,
  reposted: false,
  saved: false,
  tags: [],
  status: occurrence.status,
  moderationReason: occurrence.moderationReason,
  forwardingDueAt: occurrence.forwardingDueAt,
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

  private cacheOccurrence(post: SpectrumPost): void {
    const remaining = this.getUserPosts().filter((item) => item.id !== post.id);
    localStorage.setItem(this.storageKey, JSON.stringify([this.withoutComputedPostState(post), ...remaining]));
  }

  private isRelatedAgency(post: SpectrumPost, user: LoggedUser | null): boolean {
    return user?.occurrenceRole === 'RESPONSIBLE_AGENCY' && Boolean(user.occurrenceAgencyId) && user.occurrenceAgencyId === post.responsibleAgency?.id;
  }

  private assertTransition(post: SpectrumPost, permitted: boolean, statuses: OccurrenceStatus[]): void {
    const current = this.isApiId(post.id) ? post : this.findPostById(post.id);
    if (!permitted || !current || !statuses.includes(current.status)) {
      throw new Error('Esta ação não está disponível para seu perfil ou para a situação atual da ocorrência.');
    }
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

  private actorTypeForUser(user: LoggedUser | null): OccurrenceActorType {
    if (user?.occurrenceRole === 'RESPONSIBLE_AGENCY') {
      return 'RESPONSIBLE_AGENCY';
    }

    if (user?.occurrenceRole === 'MODERATOR') {
      return 'MODERATOR';
    }

    return 'USER';
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

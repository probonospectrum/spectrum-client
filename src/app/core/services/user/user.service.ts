import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, timeout } from 'rxjs/operators';
import { API_BASE_URL } from '../../constants/api-routes';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface CreateUserRequest {
  name: string;
  nickname: string;
  email: string;
  password: string;
  birthDate: string;
  avatarUrl?: string;
  cityUser: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoggedUser {
  _id: string;
  name: string;
  nickname: string;
  email: string;
  birthDate: string;
  isVerified?: boolean;
  avatarUrl?: string;
  cityUser?: string;
  following?: string[];
  occurrenceRole?: 'USER' | 'RESPONSIBLE_AGENCY' | 'MODERATOR';
  occurrenceAgencyId?: string;
}

export interface LoginResponse extends MessageResponse {
  token: string;
  user: LoggedUser;
}

export interface CreateUserResponse extends MessageResponse {
  user: LoggedUser;
}

export interface UpdateAvatarResponse extends MessageResponse {
  avatarUrl: string;
}

export interface PublicProfileResponse {
  _id: string;
  name: string;
  nickname: string;
  avatarUrl?: string;
  cityUser: string;
  isVerified?: boolean;
  createdAt?: string;
  followingCount: number;
  followersCount: number;
  isFollowing: boolean;
  canViewPosts: boolean;
}

export interface FollowUserSummary {
  _id: string;
  name: string;
  nickname: string;
  avatarUrl?: string;
  isFollowing: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly sessionStorageKey = 'spectrum-auth-session';

  private readonly apiUrl = `${API_BASE_URL}/user`;
  private readonly session = signal<LoginResponse | null>(this.readStoredSession());
  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);

  constructor(private readonly http: HttpClient) {}

  searchProfiles(term: string): Observable<Pick<PublicProfileResponse, 'name' | 'nickname' | 'avatarUrl'>[]> {
    return this.http.get<Pick<PublicProfileResponse, 'name' | 'nickname' | 'avatarUrl'>[]>(
      this.apiUrl + '/search', { params: { q: term } },
    );
  }

  getPublicProfile(nickname: string): Observable<PublicProfileResponse> {
    return this.http.get<PublicProfileResponse>(`${this.apiUrl}/profile/${encodeURIComponent(nickname)}`);
  }

  followUser(targetId: string, follow: boolean): Observable<{ user: LoggedUser; isFollowing: boolean }> {
    const userId = this.currentUser()?._id;
    return this.http.patch<{ user: LoggedUser; isFollowing: boolean }>(`${this.apiUrl}/${userId}/${follow ? 'follow' : 'unfollow'}/${targetId}`, {}).pipe(
      tap((response) => this.updateSessionUser(response.user)),
    );
  }

  getConnections(userId: string, type: 'followers' | 'following'): Observable<FollowUserSummary[]> {
    return this.http.get<FollowUserSummary[]>(API_BASE_URL + '/follows/' + userId + '/' + type);
  }

  removeFollower(userId: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(API_BASE_URL + '/follows/me/followers/' + userId);
  }

  updateAccount(patch: { name?: string; nickname?: string }): Observable<LoggedUser> {
    return this.http.patch<LoggedUser>(`${this.apiUrl}/me/account`, patch).pipe(tap((user) => this.updateSessionUser(user)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.apiUrl}/me/password`, { currentPassword, newPassword });
  }

  private updateSessionUser(user: LoggedUser): void {
    const session = this.session();
    if (session?.user._id === user._id) this.saveSession({ ...session, user: { ...session.user, ...user } });
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, payload)
      .pipe(timeout(15000), tap((response) => this.saveSession(response)));
  }

  create(payload: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(`${this.apiUrl}`, payload).pipe(timeout(15000));
  }

  removeAvatar(): Observable<UpdateAvatarResponse> {
    const userId = this.currentUser()?._id;
    if (!userId) {
      return throwError(() => new Error('Entre na sua conta para remover a foto.'));
    }
    return this.http.delete<UpdateAvatarResponse>(`${this.apiUrl}/${userId}/avatar`).pipe(
      timeout(60000),
      tap((response) => {
        const session = this.session();
        if (session?.user._id === userId) {
          this.saveSession({ ...session, user: { ...session.user, avatarUrl: response.avatarUrl } });
        }
      }),
    );
  }

  deleteAccount(): Observable<void> {
    const userId = this.currentUser()?._id;
    if (!userId) return throwError(() => new Error('Entre na sua conta para excluir a conta.'));
    return this.http.delete<void>(`${this.apiUrl}/${userId}`).pipe(
      timeout(15000),
      tap(() => { if (this.currentUser()?._id === userId) this.logout(); }),
    );
  }

  uploadAvatar(avatar: Blob): Observable<UpdateAvatarResponse> {
    const userId = this.currentUser()?._id;
    if (!userId) {
      return throwError(() => new Error('Entre na sua conta para salvar a foto.'));
    }
    const formData = new FormData();
    formData.append('avatar', avatar, 'avatar.png');
    return this.http.patch<UpdateAvatarResponse>(this.apiUrl + '/' + userId + '/avatar', formData).pipe(
      timeout(60000),
      tap((response) => {
        const session = this.session();
        // Uma resposta antiga não deve restaurar uma sessão encerrada ou de outra conta.
        if (session?.user._id === userId) {
          this.saveSession({ ...session, user: { ...session.user, avatarUrl: response.avatarUrl } });
        }
      }),
    );
  }

  getCurrentUser(): LoggedUser | null {
    return this.currentUser();
  }

  getToken(): string | null {
    return this.token();
  }

  isLoggedIn(): boolean {
    return !!this.token() && !!this.currentUser();
  }

  logout(): void {
    localStorage.removeItem(this.sessionStorageKey);
    this.session.set(null);
  }

  saveSession(response: LoginResponse): void {
    localStorage.setItem(this.sessionStorageKey, JSON.stringify(response));
    this.session.set(response);
  }

  private readStoredSession(): LoginResponse | null {
    const rawSession = localStorage.getItem(this.sessionStorageKey);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as LoginResponse;
    } catch {
      localStorage.removeItem(this.sessionStorageKey);
      return null;
    }
  }
}

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

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, payload)
      .pipe(timeout(15000), tap((response) => this.saveSession(response)));
  }

  create(payload: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(`${this.apiUrl}`, payload).pipe(timeout(15000));
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

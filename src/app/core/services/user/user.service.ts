import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  avatarUrl: string;
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
}

export interface LoginResponse extends MessageResponse {
  token: string;
  user: LoggedUser;
}

export interface CreateUserResponse extends MessageResponse {
  user: LoggedUser;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly sessionStorageKey = 'spectrum-auth-session';

  private readonly apiUrl = `${API_BASE_URL}/user`;

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, payload)
      .pipe(timeout(15000), tap((response) => this.saveSession(response)));
  }

  create(payload: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(`${this.apiUrl}`, payload).pipe(timeout(15000));
  }

  getCurrentUser(): LoggedUser | null {
    return this.getSession()?.user ?? null;
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  logout(): void {
    localStorage.removeItem(this.sessionStorageKey);
  }

  saveSession(response: LoginResponse): void {
    localStorage.setItem(this.sessionStorageKey, JSON.stringify(response));
  }

  private getSession(): LoginResponse | null {
    const rawSession = localStorage.getItem(this.sessionStorageKey);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as LoginResponse;
    } catch {
      this.logout();
      return null;
    }
  }
}

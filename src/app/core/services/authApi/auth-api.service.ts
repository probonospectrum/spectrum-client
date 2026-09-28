import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, timeout } from 'rxjs';
import { googleAuthConfig } from '../../config/auth-config';
import { API_BASE_URL } from '../../constants/api-routes';
import { LoginResponse, UserService } from '../user/user.service';

export interface PendingGoogleRegistration {
  requiresRegistration: true;
  registrationToken: string;
  profile: { email: string; name: string };
}

export type GoogleLoginResponse = LoginResponse | PendingGoogleRegistration;

export function requiresGoogleRegistration(
  response: GoogleLoginResponse,
): response is PendingGoogleRegistration {
  return 'requiresRegistration' in response && response.requiresRegistration === true;
}

export interface GoogleRegistrationRequest {
  registrationToken: string;
  name: string;
  nickname: string;
  password: string;
  birthDate: string;
  cityUser: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly pendingKey = 'spectrum-google-registration';

  loginWithGoogle(code: string): Observable<GoogleLoginResponse> {
    this.clearPendingRegistration();
    return this.http
      .post<GoogleLoginResponse>(`${API_BASE_URL}/auth/google`, {
        code,
        redirectUri: googleAuthConfig.redirectUri,
      })
      .pipe(
        timeout(60000),
        tap((response) => {
          if (response && requiresGoogleRegistration(response)) {
            if (!response.registrationToken || !response.profile?.email) {
              throw new Error('O servidor não retornou os dados de cadastro.');
            }
            sessionStorage.setItem(this.pendingKey, JSON.stringify(response));
          } else {
            this.saveSession(response);
          }
        }),
      );
  }

  getPendingRegistration(): PendingGoogleRegistration | null {
    try {
      const raw = sessionStorage.getItem(this.pendingKey);
      const pending = raw ? (JSON.parse(raw) as PendingGoogleRegistration) : null;
      return pending?.registrationToken && pending.profile?.email ? pending : null;
    } catch {
      this.clearPendingRegistration();
      return null;
    }
  }

  clearPendingRegistration(): void {
    sessionStorage.removeItem(this.pendingKey);
  }

  completeGoogleRegistration(payload: GoogleRegistrationRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/google/complete-registration`, payload)
      .pipe(
        timeout(60000),
        tap((response) => {
          this.saveSession(response);
          this.clearPendingRegistration();
        }),
      );
  }

  private saveSession(response: LoginResponse): void {
    if (!response?.token || !response.user?._id) {
      throw new Error('O servidor não retornou uma sessão válida.');
    }
    this.userService.saveSession(response);
  }
}

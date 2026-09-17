import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';
import { LoginResponse, UserService } from '../user/user.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  loginWithGoogle(code: string): Observable<LoginResponse> {
  return this.http
    .post<LoginResponse>(`${API_BASE_URL}/auth/google`, {
      code,
      redirectUri: window.location.origin + '/auth/callback',
    })
    .pipe(tap((response) => this.userService.saveSession(response)));
}
}

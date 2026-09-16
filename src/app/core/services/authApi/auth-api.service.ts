import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/auth`;

  loginWithGoogle(idToken: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/google`, { idToken });
  }
}

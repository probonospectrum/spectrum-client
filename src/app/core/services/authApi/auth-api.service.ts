import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/auth'; // ajuste pra sua API

  loginWithGoogle(idToken: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/google`, { idToken });
  }
}
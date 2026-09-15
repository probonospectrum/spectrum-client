
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserService,LoginResponse } from '../user/user.service';
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly baseUrl = this.getBaseUrl();

  

  loginWithGoogle(code: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/google`, { code })
      .pipe(tap((response) => this.userService.saveSession(response)));
  }

  private getBaseUrl(): string {
    const isLocal = window.location.hostname === 'localhost';
    return isLocal
      ? 'http://localhost:3000'
      : 'https://spectrum-server-2qne.onrender.com'; 
  }
}
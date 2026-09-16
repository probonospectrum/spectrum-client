import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { googleAuthConfig } from '../../config/auth-config';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly oauthService : OAuthService = inject(OAuthService);

  constructor() {
    this.oauthService.configure(googleAuthConfig);
    this.oauthService.loadDiscoveryDocument().catch((err) => {
    console.error('Erro ao carregar discovery document:', err);
  });
  }

  login(): void {
    this.oauthService.initLoginFlow(); // redireciona pro Google
  }

  getAuthorizationCode(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  }

  clearUrlParams(): void {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  logout(): void {
    this.oauthService.logOut();
  }
}
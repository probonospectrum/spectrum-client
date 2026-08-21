import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { googleAuthConfig } from '../../config/auth-config';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly oauthService = inject(OAuthService);

  constructor() {
    this.oauthService.configure(googleAuthConfig);
    this.oauthService.loadDiscoveryDocument(); // busca o /.well-known/openid-configuration do Google
  }

  login(): void {
    this.oauthService.initLoginFlow(); // redireciona pro Google
  }

  get idToken(): string {
    return this.oauthService.getIdToken();
  }

  get isLoggedIn(): boolean {
    return this.oauthService.hasValidIdToken();
  }

  logout(): void {
    this.oauthService.logOut();
  }
}
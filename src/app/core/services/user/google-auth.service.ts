import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { googleAuthConfig } from '../../config/auth-config';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly oauthService: OAuthService = inject(OAuthService);
  readonly isConfigured = Boolean(googleAuthConfig.clientId);

  constructor() {
    if (!this.isConfigured) {
      return;
    }

    this.oauthService.configure(googleAuthConfig);
    void this.oauthService.loadDiscoveryDocument();
  }

  login(): void {
    if (this.isConfigured) {
      this.oauthService.initLoginFlow();
    }
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

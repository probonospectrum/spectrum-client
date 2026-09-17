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

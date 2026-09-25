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
    this.oauthService.setStorage(sessionStorage);
  }

  async login(): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('O login com Google não está configurado.');
    }
    await this.oauthService.loadDiscoveryDocument();
    this.oauthService.initLoginFlow();
  }

  getAuthorizationCode(): string | null {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');
    const expectedState = sessionStorage.getItem('nonce');
    sessionStorage.removeItem('nonce');
    this.clearUrlParams();

    if (!state || !expectedState || state !== expectedState) {
      throw new Error('Não foi possível validar esta tentativa de login. Volte e tente novamente.');
    }
    if (error) {
      throw new Error(
        error === 'access_denied'
          ? 'O login com Google foi cancelado. Você pode tentar novamente.'
          : 'O Google não autorizou o login. Tente novamente.',
      );
    }
    return code;
  }

  clearUrlParams(): void {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  logout(): void {
    this.oauthService.logOut();
  }
}

import { TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { vi } from 'vitest';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  const oauth = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    loadDiscoveryDocument: vi.fn(),
    initLoginFlow: vi.fn(),
  };
  let service: GoogleAuthService;
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    TestBed.configureTestingModule({ providers: [{ provide: OAuthService, useValue: oauth }] });
    service = TestBed.inject(GoogleAuthService);
  });
  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });
  it('aguarda o discovery antes de redirecionar', async () => {
    let resolve!: () => void;
    oauth.loadDiscoveryDocument.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const login = service.login();
    expect(oauth.initLoginFlow).not.toHaveBeenCalled();
    resolve();
    await login;
    expect(oauth.initLoginFlow).toHaveBeenCalledOnce();
  });
  it('propaga falhas do discovery sem iniciar o login', async () => {
    oauth.loadDiscoveryDocument.mockRejectedValue(new Error('offline'));
    await expect(service.login()).rejects.toThrow('offline');
    expect(oauth.initLoginFlow).not.toHaveBeenCalled();
  });
  it('aceita uma única vez o código com state correspondente e limpa a URL', () => {
    sessionStorage.setItem('nonce', 'expected');
    window.history.replaceState({}, '', '/auth/callback?code=test-code&state=expected');
    expect(service.getAuthorizationCode()).toBe('test-code');
    expect(window.location.search).toBe('');
    expect(sessionStorage.getItem('nonce')).toBeNull();
    expect(() => service.getAuthorizationCode()).toThrow('validar');
  });
  it('rejeita state incorreto', () => {
    sessionStorage.setItem('nonce', 'expected');
    window.history.replaceState({}, '', '/auth/callback?code=test-code&state=wrong');
    expect(() => service.getAuthorizationCode()).toThrow('validar');
  });
  it('explica quando o usuário cancela a autorização', () => {
    sessionStorage.setItem('nonce', 'expected');
    window.history.replaceState({}, '', '/auth/callback?error=access_denied&state=expected');
    expect(() => service.getAuthorizationCode()).toThrow('cancelado');
  });
});

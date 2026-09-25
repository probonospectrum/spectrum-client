import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AuthApiService } from './auth-api.service';
import { UserService } from '../user/user.service';
import { API_BASE_URL } from '../../constants/api-routes';
import { googleAuthConfig } from '../../config/auth-config';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let http: HttpTestingController;
  const saveSession = vi.fn();
  beforeEach(() => {
    saveSession.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: { saveSession } },
      ],
    });
    service = TestBed.inject(AuthApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });
  it('envia o código e o mesmo redirectUri usado na autorização e salva a sessão', () => {
    service.loginWithGoogle('test-code').subscribe();
    const request = http.expectOne(`${API_BASE_URL}/auth/google`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      code: 'test-code',
      redirectUri: googleAuthConfig.redirectUri,
    });
    const response = { token: 'spectrum-token', user: { _id: 'user-id' } };
    request.flush(response);
    expect(saveSession).toHaveBeenCalledWith(response);
  });
  it('não salva respostas sem usuário válido', () => {
    const error = vi.fn();
    service.loginWithGoogle('test-code').subscribe({ error });
    http.expectOne(`${API_BASE_URL}/auth/google`).flush({ token: 'token' });
    expect(error).toHaveBeenCalledOnce();
    expect(saveSession).not.toHaveBeenCalled();
  });
  it('guarda o cadastro pendente sem criar sessão autenticada', () => {
    service.loginWithGoogle('test-code').subscribe();
    const pending = {
      requiresRegistration: true,
      registrationToken: 'pending-token',
      profile: { email: 'test@example.com', name: 'Teste' },
    };
    http.expectOne(`${API_BASE_URL}/auth/google`).flush(pending);
    expect(service.getPendingRegistration()).toEqual(pending);
    expect(saveSession).not.toHaveBeenCalled();
  });
  it('conclui cadastro e remove o token temporário depois de salvar a sessão', () => {
    service.loginWithGoogle('test-code').subscribe();
    http
      .expectOne(`${API_BASE_URL}/auth/google`)
      .flush({
        requiresRegistration: true,
        registrationToken: 'pending-token',
        profile: { email: 'test@example.com', name: 'Teste' },
      });
    const payload = {
      registrationToken: 'pending-token',
      name: 'Teste',
      nickname: 'teste',
      password: 'spectrum-test-password',
      birthDate: '2000-01-01',
      cityUser: 'Salvador - BA',
    };
    service.completeGoogleRegistration(payload).subscribe();
    const request = http.expectOne(`${API_BASE_URL}/auth/google/complete-registration`);
    expect(request.request.body).toEqual(payload);
    request.flush({ token: 'spectrum-token', user: { _id: 'user-id' } });
    expect(service.getPendingRegistration()).toBeNull();
    expect(saveSession).toHaveBeenCalledOnce();
  });
});

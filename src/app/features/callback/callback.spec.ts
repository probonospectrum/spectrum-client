import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CallbackPage } from './callback';
import { GoogleAuthService } from '../../core/services/user/google-auth.service';
import { AuthApiService } from '../../core/services/authApi/auth-api.service';

describe('CallbackPage', () => {
  const getAuthorizationCode = vi.fn();
  const loginWithGoogle = vi.fn();
  const navigate = vi.fn();
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthorizationCode.mockReturnValue('test-code');
    loginWithGoogle.mockReturnValue(of({}));
    TestBed.configureTestingModule({
      imports: [CallbackPage],
      providers: [
        { provide: GoogleAuthService, useValue: { getAuthorizationCode } },
        { provide: AuthApiService, useValue: { loginWithGoogle } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });
  it('troca o código uma vez e navega após o sucesso', async () => {
    const fixture = TestBed.createComponent(CallbackPage);
    await fixture.whenStable();
    expect(loginWithGoogle).toHaveBeenCalledExactlyOnceWith('test-code');
    expect(navigate).toHaveBeenCalledWith(['/publicacoes'], { replaceUrl: true, queryParams: {} });
  });
  it('mantém a falha da API visível até o usuário voltar ao login', async () => {
    loginWithGoogle.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(CallbackPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Verifique se a API está disponível');
    expect(navigate).not.toHaveBeenCalled();
    fixture.componentInstance.backToLogin();
    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
  it('não chama a API quando o retorno é inválido', async () => {
    getAuthorizationCode.mockImplementation(() => {
      throw new Error('State inválido');
    });
    const fixture = TestBed.createComponent(CallbackPage);
    await fixture.whenStable();
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('State inválido');
  });
  it('envia contas novas para completar cadastro sem ir às publicações', async () => {
    loginWithGoogle.mockReturnValue(
      of({
        requiresRegistration: true,
        registrationToken: 'pending-token',
        profile: { email: 'test@example.com', name: 'Teste' },
      }),
    );
    const fixture = TestBed.createComponent(CallbackPage);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/cadastro'], {
      replaceUrl: true,
      queryParams: { google: '1' },
    });
  });
});

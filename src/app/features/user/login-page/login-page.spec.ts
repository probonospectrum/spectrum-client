import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from '../../../core/services/authApi/auth-api.service';
import { GoogleAuthService } from '../../../core/services/user/google-auth.service';

import { CityService } from '../../../core/services/city/city.service';
import { UserService } from '../../../core/services/user/user.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: OAuthService,
          useValue: {
            configure: () => undefined,
            setStorage: () => undefined,
            loadDiscoveryDocument: () => Promise.resolve(),
            loadDiscoveryDocumentAndTryLogin: () => Promise.resolve(),
            initLoginFlow: () => undefined,
            getIdToken: () => '',
            hasValidIdToken: () => false,
            logOut: () => undefined,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                mode: 'login',
              },
            },
          },
        },
        {
          provide: CityService,
          useValue: {
            findStates: () => of([]),
            findCitiesByState: () => of([]),
          },
        },
        {
          provide: UserService,
          useValue: {
            login: () => of(null),
            create: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('preenche e bloqueia o e-mail Google ao completar cadastro', () => {
    const route = TestBed.inject(ActivatedRoute);
    route.snapshot.data['mode'] = 'register';
    Object.defineProperty(route.snapshot, 'queryParamMap', {
      value: { get: () => '1' },
      configurable: true,
    });
    vi.spyOn(TestBed.inject(AuthApiService), 'getPendingRegistration').mockReturnValue({
      requiresRegistration: true,
      registrationToken: 'pending-token',
      profile: { email: 'google@example.com', name: 'Google User' },
    });
    const registrationFixture = TestBed.createComponent(LoginPage);
    const page = registrationFixture.componentInstance;
    registrationFixture.detectChanges();
    expect(page.registerForm.controls.email.disabled).toBe(true);
    expect(page.registerForm.getRawValue().email).toBe('google@example.com');
    expect(page.registerForm.getRawValue().name).toBe('Google User');
  });

  it('envia o formulário Google ao endpoint de conclusão, sem chamar cadastro comum', () => {
    component.pendingGoogleRegistration = {
      requiresRegistration: true,
      registrationToken: 'pending-token',
      profile: { email: 'google@example.com', name: 'Teste' },
    };
    component.registerForm.patchValue({
      name: 'Teste',
      nickname: 'teste',
      email: 'google@example.com',
      password: 'spectrum-password',
      birthDate: '2000-01-01',
      stateId: '29',
      cityUser: 'Salvador - BA',
    });
    const api = vi
      .spyOn(TestBed.inject(AuthApiService), 'completeGoogleRegistration')
      .mockReturnValue(throwError(() => new Error('test failure')));
    const normalSignup = vi.spyOn(TestBed.inject(UserService), 'create');
    component.submitRegister();
    expect(api).toHaveBeenCalledWith({
      registrationToken: 'pending-token',
      name: 'Teste',
      nickname: 'teste',
      password: 'spectrum-password',
      birthDate: '2000-01-01',
      cityUser: 'Salvador - BA',
    });
    expect(normalSignup).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
    expect(component.alert()?.title).toBe('Não foi possível concluir o cadastro');
  });

  it('mostra falhas ao abrir o Google e libera uma nova tentativa', async () => {
    vi.spyOn(TestBed.inject(GoogleAuthService), 'login').mockRejectedValue(new Error('offline'));
    await component.loginWithGoogle();
    expect(component.alert()?.title).toBe('Erro no login Google');
    expect(component.isSubmitting()).toBe(false);
  });
});

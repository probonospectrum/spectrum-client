import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AlertPopup, AlertPopupType } from '../../../shared/components/alert-popup/alert-popup';
import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { Button } from '../../../shared/components/button/button';

import {
  SpectrumInput,
} from '../../../shared/components/input/input/input';

import {
  SelectOption,
  SpectrumSelect,
} from '../../../shared/components/select/select';

import {
  BrazilCity,
  BrazilState,
  CityService,
} from '../../../core/services/city/city.service';

import { UserService } from '../../../core/services/user/user.service';
import { GoogleAuthService } from '../../../core/services/user/google-auth.service';
import { AuthApiService } from '../../../core/services/authApi/auth-api.service';
type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login-page',

  imports: [
    ReactiveFormsModule,
    AlertPopup,
    AuthShell,
    Button,
    SpectrumInput,
    SpectrumSelect,
    RouterLink
],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage implements OnInit {

  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly cityService = inject(CityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly authApiService = inject(AuthApiService);
  readonly isGoogleLoginAvailable = this.googleAuth.isConfigured;

  mode = signal<AuthMode>('login');

  registerStep = signal(1);

  isSubmitting = signal(false);
  isLoadingStates = signal(false);
  isLoadingCities = signal(false);

  alert = signal<{
    type: AlertPopupType;
    title: string;
    message: string;
    actionLabel: string;
  } | null>(null);

  private alertRedirectUrl: string | null = null;

  states = signal<BrazilState[]>([]);
  cities = signal<BrazilCity[]>([]);

  readonly loginForm = this.formBuilder.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    nickname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    birthDate: ['', Validators.required],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(30),
      ],
    ],
    name: ['', Validators.required],
    stateId: ['', Validators.required],
    cityUser: ['', Validators.required],
  });

  ngOnInit(): void {

    const routeMode = this.route.snapshot.data['mode'];

    this.mode.set(routeMode === 'register'
      ? 'register'
      : 'login');

    this.loadStates();
    this.registerForm.controls.stateId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stateId) => {
        this.loadCities(stateId);
      });

    this.tryGoogleLogin();
  }

  private tryGoogleLogin(): void {
    if (!this.googleAuth.isConfigured) {
      return;
    }

    const code = this.googleAuth.getAuthorizationCode();

    if (!code) {
      return;
    }

    this.isSubmitting.set(true);
    this.authApiService
      .loginWithGoogle(code)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.googleAuth.clearUrlParams();
          void this.router.navigate(['/publicacoes']);
        },
        error: () => {
          this.googleAuth.clearUrlParams();
          this.alert.set({
            type: 'error',
            title: 'Erro no login',
            message: 'Não foi possível fazer o login com o Google.',
            actionLabel: 'Fechar',
          });
        },
      });
  }

  get isRegisterMode(): boolean {
    return this.mode() === 'register';
  }

  get stateOptions(): SelectOption[] {
    return this.states().map((state) => ({
      value: String(state.id),
      label: `${state.nome} - ${state.sigla}`,
    }));
  }

  get cityOptions(): SelectOption[] {

    const selectedState = this.selectedState;

    return this.cities().map((city) => ({
      value: selectedState
        ? `${city.nome} - ${selectedState.sigla}`
        : city.nome,
      label: city.nome,
    }));
  }

  get isCitySelectDisabled(): boolean {
    return (
      !this.registerForm.controls.stateId.value ||
      this.isLoadingCities() ||
      !this.cities().length
    );
  }

  goToRegister(): void {

    this.mode.set('register');
    this.registerStep.set(1);

    this.dismissAlert();
  }

  goToLogin(): void {

    this.mode.set('login');
    this.registerStep.set(1);

    this.dismissAlert();
  }

  goToNextRegisterStep(): void {

    const firstStepControls = [
      'nickname',
      'email',
      'birthDate',
      'password',
    ] as const;

    firstStepControls.forEach((controlName) => {
      this.registerForm.controls[controlName].markAsTouched();
    });

    const hasInvalidField = firstStepControls.some(
      (controlName) =>
        this.registerForm.controls[controlName].invalid,
    );

    if (!hasInvalidField) {
      this.registerStep.set(2);
    }
  }

  goToPreviousRegisterStep(): void {
    this.registerStep.set(1);
  }

  submitLogin(): void {

    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {

      this.showAlert(
        'error',
        'Campos obrigatorios',
        'Informe seu nome de usuario ou email e sua senha para entrar.',
      );

      return;
    }

    this.isSubmitting.set(true);

    this.userService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({

        next: (response) => {
          this.showAlert(
            'success',
            'Login realizado',
            response.message || 'Voce entrou na sua conta com sucesso.',
            'Continuar',
            '/publicacoes',
          );
        },

        error: (error: unknown) => {
          this.showAlert(
            'error',
            'Nao foi possivel entrar',
            this.getErrorMessage(
              error,
              'Verifique seu usuario, email e senha.',
            ),
          );
        },
      });
  }

  loginWithGoogle(): void {
    this.googleAuth.login();
  }

  submitRegister(): void {

    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {

      this.showAlert(
        'error',
        'Cadastro incompleto',
        'Preencha todos os campos obrigatorios para criar sua conta.',
      );

      return;
    }

    const {
      stateId: _stateId,
      ...payload
    } = this.registerForm.getRawValue();

    this.isSubmitting.set(true);

    this.userService
      .create({
        ...payload,
        avatarUrl: 'https://placehold.co/200x200.png',
      })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({

        next: (response) => {
          this.showAlert(
            'success',
            'Cadastro criado',
            response.message,
            'Entendi',
          );
        },

        error: (error: unknown) => {
          this.showAlert(
            'error',
            'Cadastro nao realizado',
            this.getErrorMessage(
              error,
              'Verifique os dados informados e tente novamente.',
            ),
          );
        },
      });
  }

  dismissAlert(): void {

    const redirectUrl = this.alertRedirectUrl;

    this.alert.set(null);
    this.alertRedirectUrl = null;

    if (redirectUrl) {
      void this.router.navigateByUrl(redirectUrl);
    }
  }

  fieldError(
    form: 'login' | 'register',
    controlName: string,
  ): string {

    const control =
      form === 'login'
        ? this.loginForm.get(controlName)
        : this.registerForm.get(controlName);

    if (!control || !control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Campo obrigatorio';
    }

    if (control.hasError('email')) {
      return 'Digite um email valido';
    }

    if (control.hasError('minlength')) {
      return 'A senha deve ter no minimo 10 caracteres';
    }

    if (control.hasError('maxlength')) {
      return 'A senha deve ter no maximo 30 caracteres';
    }

    return 'Valor invalido';
  }

  private get selectedState(): BrazilState | undefined {

    const selectedStateId =
      this.registerForm.controls.stateId.value;

    return this.states().find(
      (state) =>
        String(state.id) === selectedStateId,
    );
  }

  private loadStates(): void {

    this.isLoadingStates.set(true);

    this.cityService
      .findStates()
      .pipe(
        finalize(() => this.isLoadingStates.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({

      next: (states) => {

        this.states.set(states);
      },

      error: () => {
        this.showAlert(
          'error',
          'Estados indisponiveis',
          'Nao foi possivel carregar os estados.',
        );
      },
    });
  }

  private loadCities(stateId: string): void {

    this.cities.set([]);

    this.registerForm.controls.cityUser.setValue('');

    if (!stateId) {
      return;
    }

    this.isLoadingCities.set(true);

    this.cityService
      .findCitiesByState(stateId)
      .pipe(
        finalize(() => this.isLoadingCities.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({

        next: (cities) => {

          this.cities.set(cities);
        },

        error: () => {
          this.showAlert(
            'error',
            'Municipios indisponiveis',
            'Nao foi possivel carregar os municipios.',
          );
        },
      });
  }

  private showAlert(
    type: AlertPopupType,
    title: string,
    message: string,
    actionLabel = 'Ok',
    redirectUrl: string | null = null,
  ): void {

    this.alert.set({
      type,
      title,
      message,
      actionLabel,
    });

    this.alertRedirectUrl = redirectUrl;
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {

    if (
      error instanceof Error &&
      error.name === 'TimeoutError'
    ) {
      return 'O servidor demorou para responder. Tente novamente em alguns instantes.';
    }

    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const apiMessage = error.error?.message;

    if (Array.isArray(apiMessage)) {
      return apiMessage.join(' ');
    }

    if (
      typeof apiMessage === 'string' &&
      apiMessage.trim()
    ) {
      return apiMessage;
    }

    if (
      typeof error.error?.error === 'string' &&
      error.error.error.trim()
    ) {
      return error.error.error;
    }

    return fallback;
  }
}

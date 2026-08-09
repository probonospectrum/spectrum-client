import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthModeToggle } from '../../../shared/components/auth-mode-toggle/auth-mode-toggle';
import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { Button } from '../../../shared/components/button/button';
import { SpectrumInput } from '../../../shared/components/input/input/input';
import { UserService } from '../../../core/services/user/user.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, AuthShell, AuthModeToggle, Button, SpectrumInput],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);

  mode: AuthMode = 'login';
  registerStep = 1;
  isSubmitting = false;
  feedback = '';

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    nickname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    birthDate: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(30)]],
    name: ['', Validators.required],
    state: ['', Validators.required],
    cityId: ['', Validators.required],
  });

  ngOnInit(): void {
    const routeMode = this.route.snapshot.data['mode'];
    this.mode = routeMode === 'register' ? 'register' : 'login';
  }

  get isRegisterMode(): boolean {
    return this.mode === 'register';
  }

  goToRegister(): void {
    this.mode = 'register';
    this.registerStep = 1;
    this.feedback = '';
  }

  goToLogin(): void {
    this.mode = 'login';
    this.registerStep = 1;
    this.feedback = '';
  }

  goToNextRegisterStep(): void {
    this.feedback = '';
    const firstStepControls = ['nickname', 'email', 'birthDate', 'password'] as const;

    firstStepControls.forEach((controlName) => {
      this.registerForm.controls[controlName].markAsTouched();
    });

    const hasInvalidField = firstStepControls.some(
      (controlName) => this.registerForm.controls[controlName].invalid,
    );

    if (!hasInvalidField) {
      this.registerStep = 2;
    }
  }

  goToPreviousRegisterStep(): void {
    this.feedback = '';
    this.registerStep = 1;
  }

  submitLogin(): void {
    this.feedback = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.userService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.feedback = response.message;
        this.isSubmitting = false;
      },
      error: () => {
        this.feedback = 'Não foi possível entrar. Verifique seus dados.';
        this.isSubmitting = false;
      },
    });
  }

  submitRegister(): void {
    this.feedback = '';
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    const { state: _state, ...payload } = this.registerForm.getRawValue();

    this.isSubmitting = true;
    this.userService
      .create({
        ...payload,
        avatarUrl: 'https://placehold.co/200x200.png',
      })
      .subscribe({
        next: () => {
          this.feedback = 'Cadastro enviado. Verifique seu email para validar sua conta.';
          this.isSubmitting = false;
        },
        error: () => {
          this.feedback = 'Não foi possível cadastrar. Verifique os dados informados.';
          this.isSubmitting = false;
        },
      });
  }

  fieldError(form: 'login' | 'register', controlName: string): string {
    const control =
      form === 'login'
        ? this.loginForm.get(controlName)
        : this.registerForm.get(controlName);

    if (!control || !control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }

    if (control.hasError('email')) {
      return 'Digite um email válido';
    }

    if (control.hasError('minlength')) {
      return 'A senha deve ter no mínimo 10 caracteres';
    }

    if (control.hasError('maxlength')) {
      return 'A senha deve ter no máximo 30 caracteres';
    }

    return 'Valor inválido';
  }
}

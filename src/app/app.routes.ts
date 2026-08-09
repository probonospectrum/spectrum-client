import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { HomePage } from './features/home/home-page/home-page';
import { LoginPage } from './features/user/login-page/login-page';
import { VerifyEmailPage } from './features/user/verify-email-page/verify-email-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginPage,
    data: { mode: 'login' },
  },
  {
    path: 'cadastro',
    component: LoginPage,
    data: { mode: 'register' },
  },
  {
    path: 'verify-email',
    component: VerifyEmailPage,
  },
  {
    path: 'home',
    component: HomePage,
    canActivate: [authGuard],
  },
];

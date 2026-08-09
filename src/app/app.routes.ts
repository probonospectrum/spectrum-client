import { Routes } from '@angular/router';
import { LoginPage } from './features/user/login-page/login-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
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
];

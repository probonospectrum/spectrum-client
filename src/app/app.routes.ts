import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'publicacoes',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/user/login-page/login-page')
        .then((m) => m.LoginPage),

    data: {
      mode: 'login',
    },
  },

  {
    path: 'cadastro',
    loadComponent: () =>
      import('./features/user/login-page/login-page')
        .then((m) => m.LoginPage),

    data: {
      mode: 'register',
    },
  },

  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/user/forgot-password-page/forgot-password-page').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/user/reset-password-page/reset-password-page').then(
        (m) => m.ResetPasswordPage,
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/user/verify-email-page/verify-email-page')
        .then((m) => m.VerifyEmailPage),
  },

  {
    path: 'publicacoes',
    loadComponent: () =>
      import('./features/posts/posts-page/posts-page')
        .then((m) => m.PostsPage),

    canActivate: [authGuard],
  },

  {
    path: 'publicacoes/nova',
    loadComponent: () =>
      import('./features/posts/create-post-page/create-post-page')
        .then((m) => m.CreatePostPage),

    canActivate: [authGuard],
  },

  {
    path: 'notificacoes',
    loadComponent: () =>
      import('./features/notifications/notifications-page/notifications-page')
        .then((m) => m.NotificationsPage),

    canActivate: [authGuard],
  },

  {
    path: 'cidades/:slug',
    loadComponent: () =>
      import('./features/cities/city-page/city-page')
        .then((m) => m.CityPage),

    canActivate: [authGuard],
  },

  {
    path: 'perfil',
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page')
        .then((m) => m.ProfilePage),

    canActivate: [authGuard],
  },

  {
    path: 'perfil/:nickname',
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page')
        .then((m) => m.ProfilePage),

    canActivate: [authGuard],
  },

  {
    path: 'configuracoes',
    loadComponent: () =>
      import('./features/settings/settings-page/settings-page')
        .then((m) => m.SettingsPage),

    canActivate: [authGuard],
  },
];

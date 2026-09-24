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
  path: 'auth/callback',
  loadComponent: () =>
    import('./features/callback/callback').then((m) => m.CallbackPage),
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
    redirectTo: '/publicacoes?criar=1',
    pathMatch: 'full',
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
    path: 'occurrences/:id',
    loadComponent: () =>
      import('./features/posts/occurrence-detail-page/occurrence-detail-page')
        .then((m) => m.OccurrenceDetailPage),

    canActivate: [authGuard],
  },

  {
    path: 'ocorrencias/:id',
    loadComponent: () =>
      import('./features/posts/occurrence-detail-page/occurrence-detail-page')
        .then((m) => m.OccurrenceDetailPage),

    canActivate: [authGuard],
  },

  {
    path: 'dashboard/cidades',
    loadComponent: () =>
      import('./features/city-dashboard/city-dashboard-page/city-dashboard-page')
        .then((m) => m.CityDashboardPage),
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

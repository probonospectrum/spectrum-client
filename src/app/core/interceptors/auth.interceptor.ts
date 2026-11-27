import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-routes';
import { CommunityTermsService } from '../services/user/community-terms.service';
import { UserService } from '../services/user/user.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const users = inject(UserService);
  const token = users.getToken();
  const isApiRequest = request.url === API_BASE_URL || request.url.startsWith(`${API_BASE_URL}/`);
  if (!token || !isApiRequest) return next(request);
  const router = inject(Router);
  const path = request.url.slice(API_BASE_URL.length).split('?')[0];
  const isLoginRequest = path === '/user/login' || path.startsWith('/auth/');
  if (isLoginRequest) return next(request);

  const injector = inject(Injector);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      // Uma resposta atrasada do token anterior não deve encerrar o novo login.
      if (error instanceof HttpErrorResponse && error.status === 401 && users.getToken() === token) {
        users.logout();
        void router.navigateByUrl('/login', { replaceUrl: true });
      }
      if (error instanceof HttpErrorResponse && error.status === 403 &&
          error.error?.code === 'COMMUNITY_TERMS_REQUIRED' && users.getToken() === token) {
        const action = path === '/post' ? 'create' : path.endsWith('/contest') ? 'contest' : 'attach';
        injector.get(CommunityTermsService).openAction(action);
      }
      return throwError(() => error);
    }),
  );
};

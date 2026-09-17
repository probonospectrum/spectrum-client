// features/auth/callback/callback.ts
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { GoogleAuthService } from  '../../core/services/user/google-auth.service';
import { AuthApiService } from '../../core/services/authApi/auth-api.service';
import { AlertPopup, AlertPopupType } from '../../shared/components/alert-popup/alert-popup';


@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div class="callback-loading">
      <div class="spinner"></div>
    </div>

  @if(alert) {
    <app-alert-popup
    [type]="alert.type"
    [title]="alert.title"
    [message]="alert.message"
    [actionLabel]="alert.actionLabel"
    (dismissed)="alert = null" 
    />
  }`,
   styles: [`
    .callback-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #0a0a0a;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],

  imports: [AlertPopup],
    
})

export class CallbackPage implements OnInit {
  private oauthService: OAuthService = inject(OAuthService);
  private googleAuth: GoogleAuthService = inject(GoogleAuthService);
  private authApiService: AuthApiService = inject(AuthApiService);
  private router: Router = inject(Router);


  alert: {
    type: AlertPopupType;
    title: string;
    message: string;
    actionLabel: string;
  } | null = null;


  async ngOnInit(): Promise<void> {
    await this.oauthService.loadDiscoveryDocument();

    const code = this.googleAuth.getAuthorizationCode();
    console.log('CODE:', code); //fins de teste, ver se o code chegou mesmo

    if (!code) {
      this.router.navigate(['/login']);
      return;
    }

    this.authApiService.loginWithGoogle(code).subscribe({
      next: (response: any) => {
        console.log('SUCESSO:', response); 
        this.googleAuth.clearUrlParams();
        this.router.navigate(['/publicacoes']);
      },
      error: (err:any) => {
        console.error('Erro no  Login', err);
        this.googleAuth.clearUrlParams();
        this.router.navigate(['/login']);
        this.alert ={
            type:'error',
            title:'Erro no Login Google',
            message:'Não foi possivel fazer login com o Google.',
            actionLabel:'Fechar',
        }
      },
    });
  }
}
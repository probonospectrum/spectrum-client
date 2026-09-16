import { AuthConfig } from 'angular-oauth2-oidc';

declare const GOOGLE_CLIENT_ID: string | undefined;

const googleClientId =
  typeof GOOGLE_CLIENT_ID === 'string' && GOOGLE_CLIENT_ID.trim()
    ? GOOGLE_CLIENT_ID.trim()
    : '184147466803-nm56hqa9rqgov41bv6479qaj9v39fbdt.apps.googleusercontent.com';

export const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: window.location.origin +  '/auth/callback', //Preciso cadastrar isso aqui  no google cloud console, se n vai dar conflito de segurança com a  google
  clientId: '184147466803-nm56hqa9rqgov41bv6479qaj9v39fbdt.apps.googleusercontent.com', // vem do backend/Google Console
  scope: 'openid profile email',
  responseType: 'code',
  showDebugInformation: false,
  strictDiscoveryDocumentValidation: false,
  disablePKCE: true,
};

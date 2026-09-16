//aqui fica a integraçãao com back e SSO
import { AuthConfig } from 'angular-oauth2-oidc';

export const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: window.location.origin + '/login', //Preciso cadastrar isso aqui  no google cloud console, se n vai dar conflito de segurança com a  google
  clientId: '184147466803-nm56hqa9rqgov41bv6479qaj9v39fbdt.apps.googleusercontent.com', // vem do backend/Google Console
  scope: 'openid profile email',
  responseType: 'code', // Authorization Code Flow + PKCE (mais seguro)
  showDebugInformation: true, // desligar em produção
  strictDiscoveryDocumentValidation: false, 
  disablePKCE:true,
};
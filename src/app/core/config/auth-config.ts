import { AuthConfig } from 'angular-oauth2-oidc';

declare const GOOGLE_CLIENT_ID: string | undefined;

const googleClientId =
  typeof GOOGLE_CLIENT_ID === 'string' ? GOOGLE_CLIENT_ID.trim() : '';

export const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: `${window.location.origin}/login`,
  clientId: googleClientId,
  scope: 'openid profile email',
  responseType: 'code',
  showDebugInformation: false,
};

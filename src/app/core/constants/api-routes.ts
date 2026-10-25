declare const API_URL: string | undefined;

function normalizeApiUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

const configuredApiUrl =
  typeof API_URL === 'string' && API_URL.trim() ? API_URL : 'http://localhost:3000';
const browserHost = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
const apiUrl =
  configuredApiUrl === 'http://localhost:3000' && browserHost !== 'localhost'
    ? `http://${browserHost}:3000`
    : configuredApiUrl;

export const API_BASE_URL = normalizeApiUrl(apiUrl);

export const USER_ROUTES = {
  create: `${API_BASE_URL}/user`,
  login: `${API_BASE_URL}/user/login`,
};

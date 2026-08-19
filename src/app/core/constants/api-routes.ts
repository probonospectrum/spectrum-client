declare const API_URL: string | undefined;

function normalizeApiUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeApiUrl(
  typeof API_URL === 'string' && API_URL.trim() ? API_URL : 'http://localhost:3000',
);

export const USER_ROUTES = {
  create: `${API_BASE_URL}/user`,
  login: `${API_BASE_URL}/user/login`,
};

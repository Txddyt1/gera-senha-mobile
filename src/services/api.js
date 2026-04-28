import { Platform } from 'react-native';

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function resolveEnvUrl(envUrl) {
  const normalizedUrl = trimTrailingSlash(envUrl);

  if (Platform.OS !== 'android') {
    return normalizedUrl;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);

    // Android Emulator cannot reach the host machine through localhost.
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      parsedUrl.hostname = '10.0.2.2';
    }

    return trimTrailingSlash(parsedUrl.toString());
  } catch (error) {
    return normalizedUrl;
  }
}

function resolveApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (envUrl) {
    return resolveEnvUrl(envUrl);
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function request(path, options = {}) {
  const { body, headers = {}, method = 'GET', token } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Nao foi possivel comunicar com a API.');
  }

  return data;
}

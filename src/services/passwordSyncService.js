import axios from 'axios';
import { API_BASE_URL, resolveApiUrl } from './api';

const configuredSyncUrl = process.env.EXPO_PUBLIC_PASSWORD_SYNC_API_URL?.trim();

// Troque EXPO_PUBLIC_PASSWORD_SYNC_API_URL no .env pela URL real de sincronizacao.
// Sem essa variavel, o app usa o backend local ja existente em POST /passwords.
export const PASSWORD_SYNC_API_URL = configuredSyncUrl
  ? resolveApiUrl(configuredSyncUrl)
  : `${API_BASE_URL}/passwords`;

export async function syncPasswordWithBackend(passwordItem, token) {
  return axios.post(
    PASSWORD_SYNC_API_URL,
    {
      appName: passwordItem.appName || 'Gerador de Senha',
      clientId: passwordItem.id,
      createdAt: passwordItem.createdAt,
      password: passwordItem.password,
      value: passwordItem.password,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 10000,
    },
  );
}

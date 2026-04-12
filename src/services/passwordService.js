import { request } from './api';

export async function listPasswords(token) {
  return request('/passwords', {
    method: 'GET',
    token,
  });
}

export async function createPassword(token, payload) {
  return request('/passwords', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function deletePassword(token, id) {
  return request(`/passwords/${id}`, {
    method: 'DELETE',
    token,
  });
}

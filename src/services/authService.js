import { request } from './api';

export async function signIn(payload) {
  return request('/signin', {
    method: 'POST',
    body: payload,
  });
}

export async function signUp(payload) {
  return request('/signup', {
    method: 'POST',
    body: payload,
  });
}

export async function signOut(token) {
  return request('/signout', {
    method: 'GET',
    token,
  });
}

export async function validateSession(token) {
  return request('/session', {
    method: 'GET',
    token,
  });
}

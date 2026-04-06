import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const AUTH_SESSION_KEY = '@demo/auth-session';

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
}

async function getStorageItem(key) {
  if (canUseLocalStorage()) {
    return window.localStorage.getItem(key);
  }

  return AsyncStorage.getItem(key);
}

async function setStorageItem(key, value) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

async function removeStorageItem(key) {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(key);
    return;
  }

  await AsyncStorage.removeItem(key);
}

export async function loadAuthSession() {
  try {
    const storedValue = await getStorageItem(AUTH_SESSION_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);
    return parsedValue?.token ? parsedValue : null;
  } catch (error) {
    return null;
  }
}

export async function saveAuthSession(session) {
  try {
    await setStorageItem(AUTH_SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    return false;
  }
}

export async function clearAuthSession() {
  try {
    await removeStorageItem(AUTH_SESSION_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

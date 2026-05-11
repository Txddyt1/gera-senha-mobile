import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createJSONStorage } from 'zustand/middleware';

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
}

const memoryStorage = (() => {
  const storage = new Map();

  return {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    removeItem: (key) => {
      storage.delete(key);
    },
    setItem: (key, value) => {
      storage.set(key, value);
    },
  };
})();

function getStorageEngine() {
  if (canUseLocalStorage()) {
    return window.localStorage;
  }

  if (Platform.OS === 'web') {
    return memoryStorage;
  }

  return AsyncStorage;
}

export const persistStorage = createJSONStorage(() => ({
  getItem: (key) => getStorageEngine().getItem(key),
  removeItem: (key) => getStorageEngine().removeItem(key),
  setItem: (key, value) => getStorageEngine().setItem(key, value),
}));

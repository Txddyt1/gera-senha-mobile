import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deletePassword, listPasswords } from '../services/passwordService';
import { syncPasswordWithBackend } from '../services/passwordSyncService';
import { persistStorage } from '../services/storeStorage';

export const STORAGE_KEY = '@password_history';

function createPasswordId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createPasswordHistoryItem(password, options = {}) {
  return {
    appName: String(options.appName || '').trim(),
    createdAt: normalizeCreatedAt(options.createdAt),
    id: String(options.id || createPasswordId()),
    password,
    pending: typeof options.pending === 'boolean' ? options.pending : true,
    remoteId: options.remoteId ? String(options.remoteId) : null,
    savedByUser: true,
  };
}

function normalizeCreatedAt(createdAt) {
  if (typeof createdAt === 'number' && Number.isFinite(createdAt)) {
    return createdAt;
  }

  const parsedTimestamp = Date.parse(createdAt);

  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
}

function normalizePasswordItem(item, index) {
  const password = String(item?.password || item?.value || '');
  const appName = String(item?.appName || '').trim();
  const savedByUser = item?.savedByUser === true || !!appName;

  if (!password || !savedByUser) {
    return null;
  }

  return {
    appName,
    createdAt: normalizeCreatedAt(item?.createdAt),
    id: String(item?.id || `${normalizeCreatedAt(item?.createdAt)}-${index}`),
    password,
    pending: typeof item?.pending === 'boolean' ? item.pending : true,
    remoteId: item?.remoteId ? String(item.remoteId) : null,
    savedByUser: true,
  };
}

function createPasswordMergeKey(item) {
  return `${String(item.appName || '').trim().toLowerCase()}::${item.password}`;
}

function mergePasswordLists(currentPasswords, nextPasswords) {
  const mergedByKey = new Map();

  [...currentPasswords, ...nextPasswords].forEach((item) => {
    const mergeKey = createPasswordMergeKey(item);
    const storedItem = mergedByKey.get(mergeKey);

    if (!storedItem) {
      mergedByKey.set(mergeKey, item);
      return;
    }

    mergedByKey.set(mergeKey, {
      ...storedItem,
      appName: storedItem.appName || item.appName,
      createdAt: Math.max(storedItem.createdAt, item.createdAt),
      pending: storedItem.pending && item.pending,
      remoteId: storedItem.remoteId || item.remoteId,
    });
  });

  return Array.from(mergedByKey.values())
    .sort((first, second) => second.createdAt - first.createdAt);
}

function mapRemotePassword(item) {
  return {
    appName: item.appName,
    createdAt: item.createdAt,
    id: item.id,
    pending: false,
    remoteId: item.id,
    savedByUser: true,
    value: item.value,
  };
}

export const selectPendingPasswords = state => state.passwords.filter(item => item.pending);
export const selectPendingCount = state => selectPendingPasswords(state).length;

export const usePasswordStore = create(
  persist(
    (set, get) => ({
      hasHydrated: false,
      isOnline: false,
      isSyncing: false,
      passwords: [],
      addPassword: (payload) => {
        const passwordValue = String(payload?.password || payload?.value || payload || '');

        if (!passwordValue) {
          return null;
        }

        const newPassword = createPasswordHistoryItem(passwordValue, {
          appName: typeof payload === 'object' ? payload?.appName : '',
          createdAt: typeof payload === 'object' ? payload?.createdAt : undefined,
          id: typeof payload === 'object' ? payload?.id : undefined,
          pending: typeof payload?.pending === 'boolean' ? payload.pending : true,
          remoteId: typeof payload === 'object' ? payload?.remoteId : null,
        });

        set(state => ({
          passwords: [
            normalizePasswordItem(newPassword, 0) || newPassword,
            ...state.passwords,
          ],
        }));

        return newPassword;
      },
      clearHistory: () => {
        set({ passwords: [] });
      },
      deletePasswordItem: async (item, token) => {
        if (!item?.id) {
          return false;
        }

        if (item.remoteId && token) {
          if (!get().isOnline) {
            return false;
          }

          try {
            await deletePassword(token, item.remoteId);
          } catch (error) {
            return false;
          }
        }

        get().removePassword(item.id);
        return true;
      },
      hydrateRemotePasswords: async (token) => {
        if (!token || !get().isOnline) {
          return false;
        }

        try {
          const response = await listPasswords(token);
          get().mergePasswords((response.passwords || []).map(mapRemotePassword));
          return true;
        } catch (error) {
          return false;
        }
      },
      markAsSynced: (ids) => {
        const syncedItems = ids || [];
        const syncedById = new Map(syncedItems.map(item => (
          typeof item === 'string'
            ? [item, null]
            : [item.id, item.remoteId || null]
        )));

        if (syncedById.size === 0) {
          return;
        }

        set(state => ({
          passwords: state.passwords.map(item => (
            syncedById.has(item.id)
              ? {
                ...item,
                pending: false,
                remoteId: syncedById.get(item.id) || item.remoteId,
              }
              : item
          )),
        }));
      },
      mergePasswords: (nextPasswords) => {
        const mergedPasswords = (Array.isArray(nextPasswords) ? nextPasswords : [])
          .map(normalizePasswordItem)
          .filter(Boolean);

        set(state => ({
          passwords: mergePasswordLists(state.passwords, mergedPasswords),
        }));
      },
      removePassword: (id) => {
        set(state => ({
          passwords: state.passwords.filter(item => item.id !== id),
        }));
      },
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },
      syncPendingPasswords: async (token) => {
        const state = get();
        const pendingPasswords = selectPendingPasswords(state);

        if (
          !state.hasHydrated ||
          !state.isOnline ||
          !token ||
          state.isSyncing ||
          pendingPasswords.length === 0
        ) {
          return;
        }

        set({ isSyncing: true });

        const syncedItems = [];

        try {
          for (const passwordItem of pendingPasswords) {
            try {
              const response = await syncPasswordWithBackend(passwordItem, token);
              syncedItems.push({
                id: passwordItem.id,
                remoteId: response?.data?.password?.id,
              });
            } catch (error) {
              // Mantem pending=true para tentar de novo quando a conexao voltar.
            }
          }

          if (syncedItems.length > 0) {
            get().markAsSynced(syncedItems);
          }
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: state => ({
        passwords: state.passwords,
      }),
      storage: persistStorage,
    },
  ),
);

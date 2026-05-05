import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

export const STORAGE_KEY = '@password_history';

const PasswordHistoryContext = createContext(null);

const initialState = {
  isLoaded: false,
  passwords: [],
};

function createPasswordId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createPasswordHistoryItem(password, appName = '', pending = true) {
  return {
    id: createPasswordId(),
    appName: String(appName || '').trim(),
    password,
    createdAt: Date.now(),
    pending,
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
    id: String(item?.id || `${normalizeCreatedAt(item?.createdAt)}-${index}`),
    appName,
    password,
    createdAt: normalizeCreatedAt(item?.createdAt),
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

function passwordHistoryReducer(state, action) {
  switch (action.type) {
    case 'LOAD_PASSWORDS': {
      const loadedPasswords = action.payload
        .map(normalizePasswordItem)
        .filter(Boolean);

      return {
        ...state,
        isLoaded: true,
        passwords: mergePasswordLists(state.passwords, loadedPasswords),
      };
    }

    case 'MERGE_PASSWORDS': {
      const mergedPasswords = action.payload
        .map(normalizePasswordItem)
        .filter(Boolean);

      return {
        ...state,
        passwords: mergePasswordLists(state.passwords, mergedPasswords),
      };
    }

    case 'ADD_PASSWORD': {
      const password = String(action.payload?.password || action.payload || '');

      if (!password) {
        return state;
      }

      return {
        ...state,
        passwords: [
          normalizePasswordItem(action.payload, 0) || createPasswordHistoryItem(password),
          ...state.passwords,
        ],
      };
    }

    case 'MARK_AS_SYNCED': {
      const syncedItems = action.payload || [];
      const syncedById = new Map(syncedItems.map(item => (
        typeof item === 'string'
          ? [item, null]
          : [item.id, item.remoteId || null]
      )));

      if (syncedById.size === 0) {
        return state;
      }

      return {
        ...state,
        passwords: state.passwords.map(item => (
          syncedById.has(item.id)
            ? {
              ...item,
              pending: false,
              remoteId: syncedById.get(item.id) || item.remoteId,
            }
            : item
        )),
      };
    }

    case 'REMOVE_PASSWORD':
      return {
        ...state,
        passwords: state.passwords.filter(item => item.id !== action.payload),
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        passwords: [],
      };

    default:
      return state;
  }
}

export function PasswordHistoryProvider({ children }) {
  const [state, dispatch] = useReducer(passwordHistoryReducer, initialState);

  useEffect(() => {
    let isMounted = true;

    async function loadStoredPasswords() {
      try {
        const storedHistory = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedHistory = storedHistory ? JSON.parse(storedHistory) : [];

        if (isMounted) {
          dispatch({
            type: 'LOAD_PASSWORDS',
            payload: Array.isArray(parsedHistory) ? parsedHistory : [],
          });
        }
      } catch (error) {
        if (isMounted) {
          dispatch({
            type: 'LOAD_PASSWORDS',
            payload: [],
          });
        }
      }
    }

    loadStoredPasswords();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isLoaded) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.passwords)).catch(() => {});
  }, [state.isLoaded, state.passwords]);

  const addPassword = useCallback((payload) => {
    const passwordValue = String(payload?.password || payload?.value || payload || '');
    const appName = typeof payload === 'object' ? payload?.appName : '';
    const pending = typeof payload?.pending === 'boolean' ? payload.pending : true;

    if (!passwordValue) {
      return null;
    }

    const newPassword = createPasswordHistoryItem(passwordValue, appName, pending);

    dispatch({
      type: 'ADD_PASSWORD',
      payload: newPassword,
    });

    return newPassword;
  }, []);

  const markAsSynced = useCallback((ids) => {
    dispatch({
      type: 'MARK_AS_SYNCED',
      payload: ids,
    });
  }, []);

  const mergePasswords = useCallback((nextPasswords) => {
    dispatch({
      type: 'MERGE_PASSWORDS',
      payload: Array.isArray(nextPasswords) ? nextPasswords : [],
    });
  }, []);

  const removePassword = useCallback((id) => {
    dispatch({
      type: 'REMOVE_PASSWORD',
      payload: id,
    });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const contextValue = useMemo(() => ({
    addPassword,
    clearHistory,
    isLoaded: state.isLoaded,
    markAsSynced,
    mergePasswords,
    passwords: state.passwords,
    removePassword,
  }), [
    addPassword,
    clearHistory,
    markAsSynced,
    mergePasswords,
    removePassword,
    state.isLoaded,
    state.passwords,
  ]);

  return (
    <PasswordHistoryContext.Provider value={contextValue}>
      {children}
    </PasswordHistoryContext.Provider>
  );
}

export function usePasswordHistory() {
  const context = useContext(PasswordHistoryContext);

  if (!context) {
    throw new Error('usePasswordHistory deve ser usado dentro de PasswordHistoryProvider.');
  }

  return context;
}

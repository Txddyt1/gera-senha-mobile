import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  selectPendingCount,
  usePasswordStore,
} from '../stores/passwordStore';

export default function useSyncPasswords() {
  const token = useAuthStore(state => state.authSession?.token || null);
  const hasHydrated = usePasswordStore(state => state.hasHydrated);
  const isOnline = usePasswordStore(state => state.isOnline);
  const isSyncing = usePasswordStore(state => state.isSyncing);
  const pendingCount = usePasswordStore(selectPendingCount);
  const setOnlineStatus = usePasswordStore(state => state.setOnlineStatus);
  const syncPendingPasswords = usePasswordStore(state => state.syncPendingPasswords);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const hasConnection = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      setOnlineStatus(hasConnection);
    });

    return unsubscribe;
  }, [setOnlineStatus]);

  useEffect(() => {
    if (!hasHydrated || !isOnline || !token || pendingCount === 0) {
      return;
    }

    syncPendingPasswords(token);
  }, [hasHydrated, isOnline, pendingCount, syncPendingPasswords, token]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
  };
}

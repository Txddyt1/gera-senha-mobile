import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePasswordHistory } from '../context/PasswordHistoryContext';
import { syncPasswordWithBackend } from '../services/passwordSyncService';

export default function useSyncPasswords(token) {
  const { isLoaded, markAsSynced, passwords } = usePasswordHistory();
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const pendingPasswords = useMemo(
    () => passwords.filter(item => item.pending),
    [passwords],
  );
  const pendingCount = pendingPasswords.length;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const hasConnection = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      setIsOnline(hasConnection);
    });

    return unsubscribe;
  }, []);

  const syncPendingPasswords = useCallback(async () => {
    if (!isLoaded || !isOnline || !token || isSyncingRef.current || pendingPasswords.length === 0) {
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    const syncedItems = [];

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
      markAsSynced(syncedItems);
    }

    isSyncingRef.current = false;
    setIsSyncing(false);
  }, [isLoaded, isOnline, markAsSynced, pendingPasswords, token]);

  useEffect(() => {
    syncPendingPasswords();
  }, [syncPendingPasswords]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
  };
}

import './global.css';

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import {
  PasswordHistoryProvider,
  usePasswordHistory,
} from './src/context/PasswordHistoryContext';
import useSyncPasswords from './src/hooks/useSyncPasswords';
import HomeScream from './src/screams/homeScream';
import HistoryScream from './src/screams/historyScream';
import SigninScream from './src/screams/signinScream';
import SignupScream from './src/screams/signupScream';
import {
  createPassword,
  deletePassword,
  listPasswords,
} from './src/services/passwordService';

export default function App() {
  return (
    <AuthProvider>
      <PasswordHistoryProvider>
        <AppContent />
      </PasswordHistoryProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState('signin');
  const { isAuthenticated, isBootstrapping, token } = useAuth();
  const {
    addPassword,
    markAsSynced,
    mergePasswords,
    passwords,
    removePassword,
  } = usePasswordHistory();
  const syncState = useSyncPasswords(token);

  useEffect(() => {
    setScreen(currentScreen => {
      if (isAuthenticated && (currentScreen === 'signin' || currentScreen === 'signup')) {
        return 'home';
      }

      if (!isAuthenticated && (currentScreen === 'home' || currentScreen === 'history')) {
        return 'signin';
      }

      return currentScreen;
    });
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateHistoryFromDatabase() {
      if (screen !== 'history' || !token || !syncState.isOnline) {
        return;
      }

      try {
        const response = await listPasswords(token);

        if (!isMounted) {
          return;
        }

        mergePasswords((response.passwords || []).map(item => ({
          appName: item.appName,
          createdAt: item.createdAt,
          id: item.id,
          pending: false,
          remoteId: item.id,
          savedByUser: true,
          value: item.value,
        })));
      } catch (error) {
        // O historico local continua sendo a fonte imediata quando a API falha.
      }
    }

    hydrateHistoryFromDatabase();

    return () => {
      isMounted = false;
    };
  }, [mergePasswords, screen, syncState.isOnline, token]);

  const addToHistory = async ({ appName, pending, value }) => {
    if (!value) {
      return false;
    }

    const newPassword = addPassword({
      appName,
      pending,
      value,
    });

    return newPassword;
  };

  const savePasswordToDatabase = async ({ appName, localId, value }) => {
    if (!token || !appName?.trim() || !value) {
      return false;
    }

    try {
      await createPassword(token, {
        appName,
        value,
      });

      if (localId) {
        markAsSynced([localId]);
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDeleteHistoryItem = async (item) => {
    if (!item?.id) {
      return false;
    }

    if (item.remoteId && token) {
      if (!syncState.isOnline) {
        return false;
      }

      try {
        await deletePassword(token, item.remoteId);
      } catch (error) {
        return false;
      }
    }

    removePassword(item.id);

    return true;
  };

  if (isBootstrapping) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <ActivityIndicator color="#0E3D7A" size="large" />
        <Text className="mt-4 text-[16px] text-[#0E3D7A]">Carregando sessao...</Text>
      </SafeAreaView>
    );
  }

  if (screen === 'signin') {
    return (
      <SigninScream
        onNavigateToSignup={() => setScreen('signup')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignupScream
        onBack={() => setScreen('signin')}
      />
    );
  }

  return screen === 'home' ? (
    <HomeScream
      onNavigateToHistory={() => setScreen('history')}
      addToHistory={addToHistory}
      savePasswordToDatabase={savePasswordToDatabase}
      syncState={syncState}
    />
  ) : (
    <HistoryScream
      history={passwords}
      onBack={() => setScreen('home')}
      onDeleteItem={handleDeleteHistoryItem}
      syncState={syncState}
    />
  );
}

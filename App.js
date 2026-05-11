import './global.css';

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';
import useSyncPasswords from './src/hooks/useSyncPasswords';
import HomeScream from './src/screams/homeScream';
import HistoryScream from './src/screams/historyScream';
import SigninScream from './src/screams/signinScream';
import SignupScream from './src/screams/signupScream';
import { useAuthStore } from './src/stores/authStore';
import { usePasswordStore } from './src/stores/passwordStore';
import {
  createPassword,
} from './src/services/passwordService';

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const [screen, setScreen] = useState('signin');
  const authHasHydrated = useAuthStore(state => state.hasHydrated);
  const authSession = useAuthStore(state => state.authSession);
  const bootstrapAuth = useAuthStore(state => state.bootstrapAuth);
  const isBootstrapping = useAuthStore(state => state.isBootstrapping);
  const addPassword = usePasswordStore(state => state.addPassword);
  const deletePasswordItem = usePasswordStore(state => state.deletePasswordItem);
  const hydrateRemotePasswords = usePasswordStore(state => state.hydrateRemotePasswords);
  const markAsSynced = usePasswordStore(state => state.markAsSynced);
  const passwords = usePasswordStore(state => state.passwords);
  const passwordHasHydrated = usePasswordStore(state => state.hasHydrated);
  const syncState = useSyncPasswords();
  const isAuthenticated = !!authSession?.token;
  const token = authSession?.token || null;

  useEffect(() => {
    if (!authHasHydrated) {
      return;
    }

    bootstrapAuth();
  }, [authHasHydrated, bootstrapAuth]);

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
    if (screen !== 'history' || !token || !syncState.isOnline) {
      return;
    }

    hydrateRemotePasswords(token);
  }, [hydrateRemotePasswords, screen, syncState.isOnline, token]);

  const addToHistory = async ({ appName, createdAt, pending, remoteId, value }) => {
    if (!value) {
      return false;
    }

    const newPassword = addPassword({
      appName,
      createdAt,
      pending,
      remoteId,
      value,
    });

    return newPassword;
  };

  const savePasswordToDatabase = async ({ appName, localId, value }) => {
    if (!token || !appName?.trim() || !value) {
      return null;
    }

    try {
      const response = await createPassword(token, {
        appName,
        value,
      });

      if (localId) {
        markAsSynced([{
          id: localId,
          remoteId: response?.password?.id,
        }]);
      }

      return response?.password || null;
    } catch (error) {
      return null;
    }
  };

  const handleDeleteHistoryItem = async (item) => {
    return deletePasswordItem(item, token);
  };

  if (!authHasHydrated || !passwordHasHydrated || isBootstrapping) {
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

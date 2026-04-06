import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScream from './src/screams/homeScream';
import HistoryScream from './src/screams/historyScream';
import SigninScream from './src/screams/signinScream';
import SignupScream from './src/screams/signupScream';
import {
  loadSavedPasswords,
  saveSavedPasswords,
} from './src/services/passwordStorage';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState('signin');
  const { authSession, isAuthenticated, isBootstrapping } = useAuth();
  const [historyData, setHistoryData] = useState([]);
  const historyDataRef = useRef([]);

  const normalizeHistoryItem = (item, index) => ({
    id: item?.id || `${item?.createdAt || 'item'}-${index}-${item?.value || ''}`,
    appName: item?.appName || 'Aplicativo',
    value: item?.value || '',
    createdAt: item?.createdAt || new Date().toISOString(),
  });

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

  const historyOwnerKey = authSession?.user?.id ? String(authSession.user.id) : null;

  useEffect(() => {
    let isMounted = true;

    async function hydrateHistory() {
      if (!historyOwnerKey) {
        historyDataRef.current = [];

        if (isMounted) {
          setHistoryData([]);
        }

        return;
      }

      const savedHistory = await loadSavedPasswords(historyOwnerKey);
      const normalizedHistory = savedHistory.map(normalizeHistoryItem);

      if (!isMounted) {
        return;
      }

      historyDataRef.current = normalizedHistory;
      setHistoryData(normalizedHistory);

      if (JSON.stringify(savedHistory) !== JSON.stringify(normalizedHistory)) {
        await saveSavedPasswords(historyOwnerKey, normalizedHistory);
      }
    }

    hydrateHistory();

    return () => {
      isMounted = false;
    };
  }, [historyOwnerKey]);

  const addToHistory = async ({ appName, value }) => {
    if (!historyOwnerKey || !appName?.trim() || !value) {
      return false;
    }

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      appName: appName.trim(),
      value,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [
      newItem,
      ...historyDataRef.current,
    ];

    historyDataRef.current = nextHistory;
    setHistoryData(nextHistory);

    const persisted = await saveSavedPasswords(historyOwnerKey, nextHistory);
    return persisted || nextHistory.some(item => item.id === newItem.id);
  };

  const handleDeleteHistoryItem = async (id) => {
    if (!historyOwnerKey) {
      return false;
    }

    const nextHistory = historyDataRef.current.filter(item => item.id !== id);
    historyDataRef.current = nextHistory;
    setHistoryData(nextHistory);

    const persisted = await saveSavedPasswords(historyOwnerKey, nextHistory);
    return persisted || !nextHistory.some(item => item.id === id);
  };

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#0E3D7A" size="large" />
        <Text style={styles.loadingText}>Carregando sessao...</Text>
      </SafeAreaView>
    );
  }

  const handleClearHistory = async () => {
    if (!historyOwnerKey) {
      return;
    }

    historyDataRef.current = [];
    setHistoryData([]);
    await saveSavedPasswords(historyOwnerKey, []);
  };

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
    />
  ) : (
    <HistoryScream
      history={historyData}
      onBack={() => setScreen('home')}
      onClear={handleClearHistory}
      onDeleteItem={handleDeleteHistoryItem}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0E3D7A',
  },
});

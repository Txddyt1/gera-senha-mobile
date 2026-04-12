import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
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
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState('signin');
  const { isAuthenticated, isBootstrapping, token } = useAuth();
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

  useEffect(() => {
    let isMounted = true;

    async function hydrateHistory() {
      if (!token) {
        historyDataRef.current = [];

        if (isMounted) {
          setHistoryData([]);
        }

        return;
      }

      try {
        const response = await listPasswords(token);
        const normalizedHistory = (response.passwords || []).map(normalizeHistoryItem);

        if (!isMounted) {
          return;
        }

        historyDataRef.current = normalizedHistory;
        setHistoryData(normalizedHistory);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        historyDataRef.current = [];
        setHistoryData([]);
      }
    }

    hydrateHistory();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const addToHistory = async ({ appName, value }) => {
    if (!token || !appName?.trim() || !value) {
      return false;
    }

    try {
      const response = await createPassword(token, {
        appName,
        value,
      });
      const newItem = normalizeHistoryItem(response.password, 0);
      const nextHistory = [
        newItem,
        ...historyDataRef.current,
      ];

      historyDataRef.current = nextHistory;
      setHistoryData(nextHistory);

      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    if (!token) {
      return false;
    }

    try {
      await deletePassword(token, id);

      const nextHistory = historyDataRef.current.filter(item => item.id !== id);
      historyDataRef.current = nextHistory;
      setHistoryData(nextHistory);

      return true;
    } catch (error) {
      return false;
    }
  };

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#0E3D7A" size="large" />
        <Text style={styles.loadingText}>Carregando sessao...</Text>
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
    />
  ) : (
    <HistoryScream
      history={historyData}
      onBack={() => setScreen('home')}
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

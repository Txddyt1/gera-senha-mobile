import React, { useEffect, useRef, useState } from 'react';
import HomeScream from './src/screams/homeScream';
import HistoryScream from './src/screams/historyScream';
import SigninScream from './src/screams/signinScream';
import SignupScream from './src/screams/signupScream';
import {
  clearSavedPasswords,
  loadSavedPasswords,
  saveSavedPasswords,
} from './src/services/passwordStorage';

export default function App() {
  const [screen, setScreen] = useState('signin');
  const [historyData, setHistoryData] = useState([]);
  const historyDataRef = useRef([]);

  const normalizeHistoryItem = (item, index) => ({
    id: item?.id || `${item?.createdAt || 'item'}-${index}-${item?.value || ''}`,
    appName: item?.appName || 'Aplicativo',
    value: item?.value || '',
    createdAt: item?.createdAt || new Date().toISOString(),
  });

  useEffect(() => {
    let isMounted = true;

    async function hydrateHistory() {
      const savedHistory = await loadSavedPasswords();
      const normalizedHistory = savedHistory.map(normalizeHistoryItem);

      if (!isMounted) {
        return;
      }

      historyDataRef.current = normalizedHistory;
      setHistoryData(normalizedHistory);

      if (JSON.stringify(savedHistory) !== JSON.stringify(normalizedHistory)) {
        await saveSavedPasswords(normalizedHistory);
      }
    }

    hydrateHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const addToHistory = async ({ appName, value }) => {
    if (!appName?.trim() || !value) {
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

    const persisted = await saveSavedPasswords(nextHistory);
    return persisted || nextHistory.some(item => item.id === newItem.id);
  };

  const handleDeleteHistoryItem = async (id) => {
    const nextHistory = historyDataRef.current.filter(item => item.id !== id);
    historyDataRef.current = nextHistory;
    setHistoryData(nextHistory);

    const persisted = await saveSavedPasswords(nextHistory);
    return persisted || !nextHistory.some(item => item.id === id);
  };

  const handleClearHistory = async () => {
    historyDataRef.current = [];
    setHistoryData([]);
    await clearSavedPasswords();
  };

  const handleSignOut = () => {
    setScreen('signin');
  };

  if (screen === 'signin') {
    return (
      <SigninScream
        onEnter={() => setScreen('home')}
        onNavigateToSignup={() => setScreen('signup')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignupScream
        onBack={() => setScreen('signin')}
        onRegister={() => setScreen('home')}
      />
    );
  }

  return screen === 'home' ? (
    <HomeScream
      onNavigateToHistory={() => setScreen('history')}
      addToHistory={addToHistory}
      onSignOut={handleSignOut}
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

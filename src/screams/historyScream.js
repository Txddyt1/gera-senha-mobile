import React, { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from '../components/Toast';
import { copyToClipboard } from '../services/clipboardService';
import { androidTopInset } from '../utils/screenInsets';

export default function HistoryScream({ history = [], onBack, onDeleteItem }) {
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef(null);

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = async (password) => {
    const ok = await copyToClipboard(password);
    showToast(ok ? 'Senha copiada' : 'Erro ao copiar');
  };

  const handleDelete = async (id) => {
    setVisiblePasswords(prev => {
      const nextState = { ...prev };
      delete nextState[id];
      return nextState;
    });

    const ok = await onDeleteItem?.(id);
    showToast(ok ? 'Senha removida' : 'Erro ao remover');
  };

  function showToast(message) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    setToastMessage(message);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage('');
      });
      toastTimeoutRef.current = null;
    }, 1600);
  }

  const maskPassword = (password) => password.replace(/./g, '*');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        <View style={styles.contentGroup}>
          <Text style={styles.title}>SENHAS SALVAS</Text>

          {history.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma senha salva ainda.</Text>
          ) : null}

          {history.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.appName}>{item.appName || 'Aplicativo'}</Text>
                <Text style={styles.passwordText}>
                  {visiblePasswords[item.id] ? item.value : maskPassword(item.value)}
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  hitSlop={10}
                  onPress={() => togglePasswordVisibility(item.id)}
                  style={styles.iconAction}
                >
                  <Feather
                    color="#555555"
                    name={visiblePasswords[item.id] ? 'eye-off' : 'eye'}
                    size={20}
                  />
                </Pressable>

                <Pressable
                  hitSlop={10}
                  onPress={() => handleCopy(item.value)}
                  style={styles.iconAction}
                >
                  <Feather color="#D9A300" name="copy" size={20} />
                </Pressable>

                <Pressable
                  hitSlop={10}
                  onPress={() => handleDelete(item.id)}
                  style={styles.iconAction}
                >
                  <Feather color="#A7B3BF" name="trash-2" size={20} />
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>VOLTAR</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Toast animatedValue={toastAnim} message={toastMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: androidTopInset,
  },
  title: {
    marginBottom: 28,
    fontSize: 28,
    fontWeight: '800',
    color: '#0E3D7A',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentGroup: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#556274',
    marginBottom: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  cardBody: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  passwordText: {
    fontSize: 15,
    color: '#444444',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  iconAction: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 100,
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: '#4DA5F5',
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2,
  },
  backButtonText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

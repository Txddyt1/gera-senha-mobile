import React, { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
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
    Alert.alert(
      'Excluir senha',
      'Tem certeza que deseja excluir esta senha salva?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => confirmDelete(id),
        },
      ],
    );
  };

  const confirmDelete = async (id) => {
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
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: androidTopInset }}>
      <StatusBar style="dark" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow items-center justify-center px-[18px] py-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[340px] items-center justify-center">
          <Text className="mb-7 text-center text-[28px] font-extrabold text-[#0E3D7A]">
            SENHAS SALVAS
          </Text>

          {history.length === 0 ? (
            <Text className="mb-[18px] text-center text-[#556274]">
              Nenhuma senha salva ainda.
            </Text>
          ) : null}

          {history.map((item) => (
            <View
              key={item.id}
              className="mb-[14px] w-full flex-row items-center justify-between rounded-[16px] border-2 border-[#1F1F1F] bg-white px-[18px] py-[14px]"
            >
              <View className="flex-1">
                <Text className="mb-2 text-[16px] font-bold text-[#1B1B1B]">
                  {item.appName || 'Aplicativo'}
                </Text>
                <Text className="text-[15px] tracking-[1px] text-[#444444]">
                  {visiblePasswords[item.id] ? item.value : maskPassword(item.value)}
                </Text>
              </View>

              <View className="ml-3 flex-row items-center gap-3">
                <Pressable
                  className="min-w-[24px] items-center justify-center"
                  hitSlop={10}
                  onPress={() => togglePasswordVisibility(item.id)}
                >
                  <Feather
                    color="#555555"
                    name={visiblePasswords[item.id] ? 'eye-off' : 'eye'}
                    size={20}
                  />
                </Pressable>

                <Pressable
                  className="min-w-[24px] items-center justify-center"
                  hitSlop={10}
                  onPress={() => handleCopy(item.value)}
                >
                  <Feather color="#D9A300" name="copy" size={20} />
                </Pressable>

                <Pressable
                  className="min-w-[24px] items-center justify-center"
                  hitSlop={10}
                  onPress={() => handleDelete(item.id)}
                >
                  <Feather color="#A7B3BF" name="trash-2" size={20} />
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable
            className="mt-2 w-[100px] rounded-[4px] bg-[#4DA5F5] px-[18px] py-2.5 shadow-history-button"
            onPress={onBack}
          >
            <Text className="text-center text-[15px] font-bold text-white">VOLTAR</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Toast animatedValue={toastAnim} message={toastMessage} />
    </SafeAreaView>
  );
}

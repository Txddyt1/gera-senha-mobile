import React, { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import PasswordSyncBadge from '../components/PasswordSyncBadge';
import Toast from '../components/Toast';
import { copyToClipboard } from '../services/clipboardService';
import formatPasswordDate from '../utils/formatPasswordDate';
import { androidTopInset } from '../utils/screenInsets';

export default function HistoryScream({
  history = [],
  onBack,
  onDeleteItem,
  syncState,
}) {
  const { width } = useWindowDimensions();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  const contentWidth = Math.min(Math.max(width - 36, 0), 340);
  const pendingCount = syncState?.pendingCount || 0;
  const isOnline = !!syncState?.isOnline;
  const syncDescription = syncState?.isSyncing
    ? 'Sincronizando...'
    : pendingCount > 0
      ? `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`
      : 'Tudo sincronizado';

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

  const handleDelete = (item) => {
    setDeleteTarget(item);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const ok = await onDeleteItem?.(deleteTarget);

    if (!ok) {
      showToast(deleteTarget.remoteId && !isOnline
        ? 'Conecte-se para remover do banco'
        : 'Erro ao remover');
      return;
    }

    setVisiblePasswords(prev => {
      const nextState = { ...prev };
      delete nextState[deleteTarget.id];
      return nextState;
    });

    setDeleteTarget(null);
    showToast('Senha removida');
  };

  function showToast(message) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    setToastMessage(message);

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, 1600);
  }

  const maskPassword = (password) => password.replace(/./g, '*');

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: androidTopInset }}>
      <StatusBar style="dark" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 18,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center" style={{ width: contentWidth }}>
          <Text className="mb-7 text-center text-[28px] font-extrabold text-[#0E3D7A]">
            SENHAS SALVAS
          </Text>

          <View
            className={`mb-4 w-full rounded-[16px] border px-4 py-3 ${
              isOnline ? 'border-[#BFE8D2] bg-[#F2FBF6]' : 'border-[#FFD4D4] bg-[#FFF5F5]'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className={`mr-2 h-2.5 w-2.5 rounded-full ${
                    isOnline ? 'bg-[#1F9D55]' : 'bg-[#D64545]'
                  }`}
                />
                <Text
                  className={`text-[14px] font-bold ${
                    isOnline ? 'text-[#116B3B]' : 'text-[#9B1C1C]'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>

              <Text className="text-[13px] font-semibold text-[#556274]">
                {syncDescription}
              </Text>
            </View>
          </View>

          {history.length === 0 ? (
            <Text className="mb-[18px] text-center text-[#556274]">
              Nenhuma senha salva ainda.
            </Text>
          ) : null}

          {history.map((item) => {
            const itemPassword = item.password || item.value || '';

            return (
              <View
                key={item.id}
                className="mb-[14px] w-full flex-row items-center justify-between rounded-[16px] border-2 border-[#1F1F1F] bg-white px-[18px] py-[14px]"
              >
                <View className="flex-1">
                  <Text className="mb-2 text-[16px] font-bold text-[#1B1B1B]">
                    {item.appName || 'Senha salva'}
                  </Text>
                  <Text className="text-[15px] tracking-[1px] text-[#444444]">
                    {visiblePasswords[item.id] ? itemPassword : maskPassword(itemPassword)}
                  </Text>
                  <Text className="mt-2 text-[12px] text-[#6F7D8B]">
                    {formatPasswordDate(item.createdAt)}
                  </Text>
                  <View className="mt-2 self-start">
                    <PasswordSyncBadge pending={item.pending} />
                  </View>
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
                    onPress={() => handleCopy(itemPassword)}
                  >
                    <Feather color="#D9A300" name="copy" size={20} />
                  </Pressable>

                  <Pressable
                    className="min-w-[24px] items-center justify-center"
                    hitSlop={10}
                    onPress={() => handleDelete(item)}
                  >
                    <Feather color="#A7B3BF" name="trash-2" size={20} />
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Pressable
            className="mt-2 w-[100px] rounded-[4px] bg-[#4DA5F5] px-[18px] py-2.5 shadow-history-button"
            onPress={onBack}
          >
            <Text className="text-center text-[15px] font-bold text-white">VOLTAR</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={handleCancelDelete}
        transparent
        visible={!!deleteTarget}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full max-w-[340px] rounded-[22px] bg-white px-5 py-6">
            <Text className="text-center text-[20px] font-extrabold text-[#0E3D7A]">
              Excluir senha
            </Text>

            <Text className="mt-3 text-center text-[15px] text-[#4A5562]">
              Tem certeza que deseja excluir esta senha salva?
            </Text>

            <Pressable
              className="mt-6 rounded-lg bg-[#D64545] py-3.5"
              onPress={confirmDelete}
            >
              <Text className="text-center text-[16px] font-bold uppercase text-white">
                Excluir
              </Text>
            </Pressable>

            <Pressable
              className="mt-3 rounded-lg bg-[#0E3D7A] py-3.5"
              onPress={handleCancelDelete}
            >
              <Text className="text-center text-[16px] font-bold uppercase text-white">
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Toast message={toastMessage} />
    </SafeAreaView>
  );
}

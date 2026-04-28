import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import generatePassword from '../utils/generatePassword';
import { copyToClipboard } from '../services/clipboardService';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { contentShellStyle } from '../utils/layout';
import { androidTopInset } from '../utils/screenInsets';

export default function HomeScream({ onNavigateToHistory, addToHistory }) {
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  const handleCopy = async () => {
    if (!password) {
      showToast('Gere uma senha primeiro');
      return;
    }

    const ok = await copyToClipboard(password);
    showToast(ok ? 'Copiado' : 'Erro ao copiar');
  };

  const handleGenerate = () => {
    const generatedPassword = generatePassword();
    setPassword(generatedPassword);
    setApplicationName('');
  };

  const handleOpenSaveModal = () => {
    if (!password) {
      showToast('Gere uma senha primeiro');
      return;
    }

    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setApplicationName('');
  };

  const handleSignOut = () => {
    handleCloseModal();
    setPassword('');
    signOut();
  };

  const handleSavePassword = async () => {
    if (!password || !applicationName.trim()) {
      return;
    }

    setIsModalVisible(false);

    const wasSaved = await addToHistory?.({
      appName: applicationName,
      value: password,
    });

    setApplicationName('');
    showToast(wasSaved ? 'Senha salva' : 'Erro ao salvar');
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

  const isSaveDisabled = !password;
  const isCreateDisabled = !password || !applicationName.trim();

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: androidTopInset }}>
      <StatusBar style="dark" />

      <View className="h-14 flex-row items-center justify-between border-b border-[#ECECEC] px-6">
        <Text className="text-[18px] font-semibold text-[#1B1B1B]">Home</Text>
        <Pressable
          className="min-w-[72px] items-center justify-center rounded-lg bg-[#0E3D7A] px-3.5 py-2.5"
          hitSlop={12}
          onPress={handleSignOut}
        >
          <Text className="text-[15px] font-bold text-white">Sair</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        <View style={contentShellStyle}>
          <Text className="text-center text-[28px] font-extrabold text-[#0E3D7A]">
            GERADOR DE SENHA
          </Text>

          <Image
            className="mt-6 h-[180px] w-[180px] self-center"
            resizeMode="contain"
            source={require('../../assets/senha.png')}
          />

          <View className="mt-[18px] w-full rounded-[18px] border border-[#DDE6F4] bg-white px-5 py-[18px] shadow-card-soft">
            <Text className="mb-2 text-center text-[14px] text-[#556274]">Senha gerada</Text>
            <Text className="text-center text-[18px] font-bold text-[#0B1F33]">
              {password || 'Preencha com o botao gerar'}
            </Text>
          </View>

          <View className="mt-[22px] w-full gap-3">
            <Pressable className="rounded-lg bg-[#2E74B8] py-3.5" onPress={handleGenerate}>
              <Text className="text-center text-[16px] font-bold uppercase text-white">Gerar</Text>
            </Pressable>

            <Pressable
              className={`rounded-lg py-3.5 ${
                isSaveDisabled ? 'bg-[#A8A8A8]' : 'bg-[#2E74B8]'
              }`}
              disabled={isSaveDisabled}
              onPress={handleOpenSaveModal}
            >
              <Text className="text-center text-[16px] font-bold uppercase text-white">Salvar</Text>
            </Pressable>

            <Pressable
              className={`rounded-lg py-3.5 ${
                password ? 'bg-[#0E3D7A]' : 'bg-[#A8A8A8]'
              }`}
              disabled={!password}
              onPress={handleCopy}
            >
              <Text className="text-center text-[16px] font-bold text-white">COPIAR</Text>
            </Pressable>

            <Pressable
              className="rounded-lg bg-[#0E3D7A] py-3.5"
              onPress={() => onNavigateToHistory && onNavigateToHistory()}
            >
              <Text className="text-center text-[16px] font-bold text-white">SENHAS SALVAS</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={handleCloseModal}
        transparent
        visible={isModalVisible}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full max-w-[360px] rounded-[24px] bg-white px-[22px] py-6">
            <Text className="mb-[22px] text-center text-[21px] font-extrabold text-[#0E3D7A]">
              CADASTRO DE SENHA
            </Text>

            <View className="mb-4">
              <Text className="mb-2 text-[15px] text-[#4A5562]">Nome do aplicativo</Text>
              <TextInput
                className="h-[50px] rounded-lg border border-[#B9C7D6] bg-[#F8FBFF] px-[14px] text-[15px] text-[#0B1F33]"
                onChangeText={setApplicationName}
                placeholder="Digite a finalidade"
                placeholderTextColor="#6F7D8B"
                value={applicationName}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-[15px] text-[#4A5562]">Senha gerada</Text>
              <TextInput
                className="h-[50px] rounded-lg border border-[#B9C7D6] bg-[#EEF3F8] px-[14px] text-[15px] text-[#5A6775]"
                editable={false}
                selectTextOnFocus={false}
                value={password}
              />
            </View>

            <Pressable
              className={`mt-2 rounded-lg py-3.5 ${
                isCreateDisabled ? 'bg-[#A8A8A8]' : 'bg-[#2E74B8]'
              }`}
              disabled={isCreateDisabled}
              onPress={handleSavePassword}
            >
              <Text className="text-center text-[16px] font-bold uppercase text-white">
                Criar
              </Text>
            </Pressable>

            <Pressable
              className="mt-3 rounded-lg bg-[#0E3D7A] py-3.5"
              onPress={handleCloseModal}
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

import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import generatePassword from '../utils/generatePassword';
import { copyToClipboard } from '../services/clipboardService';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { androidTopInset } from '../utils/screenInsets';

export default function HomeScream({ onNavigateToHistory, addToHistory }) {
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;
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

  const isSaveDisabled = !password;
  const isCreateDisabled = !password || !applicationName.trim();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <Pressable hitSlop={12} onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>GERADOR DE SENHA</Text>

        <Image source={require('../../assets/senha.png')} style={styles.image} />

        <View style={styles.passwordCard}>
          <Text style={styles.passwordLabel}>Senha gerada</Text>
          <Text style={styles.passwordValue}>
            {password || 'Preencha com o botao gerar'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleGenerate} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Gerar</Text>
          </Pressable>

          <Pressable
            disabled={isSaveDisabled}
            onPress={handleOpenSaveModal}
            style={[styles.primaryButton, isSaveDisabled && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>Salvar</Text>
          </Pressable>

          <Pressable
            disabled={!password}
            onPress={handleCopy}
            style={[styles.secondaryButton, !password && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>COPIAR</Text>
          </Pressable>

          <Pressable
            onPress={() => onNavigateToHistory && onNavigateToHistory()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>SENHAS SALVAS</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={handleCloseModal}
        transparent
        visible={isModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CADASTRO DE SENHA</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Nome do aplicativo</Text>
              <TextInput
                onChangeText={setApplicationName}
                placeholder="Digite a finalidade"
                placeholderTextColor="#6F7D8B"
                style={styles.modalInput}
                value={applicationName}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Senha gerada</Text>
              <TextInput
                editable={false}
                selectTextOnFocus={false}
                style={[styles.modalInput, styles.modalInputDisabled]}
                value={password}
              />
            </View>

            <Pressable
              disabled={isCreateDisabled}
              onPress={handleSavePassword}
              style={[styles.modalPrimaryButton, isCreateDisabled && styles.disabledButton]}
            >
              <Text style={styles.modalPrimaryButtonText}>Criar</Text>
            </Pressable>

            <Pressable onPress={handleCloseModal} style={styles.modalSecondaryButton}>
              <Text style={styles.modalSecondaryButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  signOutText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  signOutButton: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0E3D7A',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0E3D7A',
    textAlign: 'center',
  },
  image: {
    width: 180,
    height: 180,
    marginTop: 24,
    resizeMode: 'contain',
  },
  passwordCard: {
    width: '100%',
    marginTop: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE6F4',
    shadowColor: '#0E3D7A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  passwordLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: '#556274',
    textAlign: 'center',
  },
  passwordValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1F33',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: 22,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: '#2E74B8',
    paddingVertical: 14,
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    borderRadius: 8,
    backgroundColor: '#0E3D7A',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#A8A8A8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '800',
    color: '#0E3D7A',
    marginBottom: 22,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    marginBottom: 8,
    fontSize: 15,
    color: '#4A5562',
  },
  modalInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B9C7D6',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 14,
    color: '#0B1F33',
    fontSize: 15,
  },
  modalInputDisabled: {
    backgroundColor: '#EEF3F8',
    color: '#5A6775',
  },
  modalPrimaryButton: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#2E74B8',
    paddingVertical: 14,
  },
  modalPrimaryButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  modalSecondaryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#0E3D7A',
    paddingVertical: 14,
  },
  modalSecondaryButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { androidTopInset } from '../utils/screenInsets';

export default function SignupScream({ onBack }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isSubmitDisabled =
    !name.trim() ||
    !email.trim() ||
    !password.trim() ||
    !confirmPassword.trim() ||
    !passwordsMatch ||
    isSubmitting;

  const handleRegister = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const result = await signUp({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result?.ok) {
      setErrorMessage(result?.message || 'Nao foi possivel concluir o cadastro.');
    }

    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => onBack && onBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Signup</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>SIGN UP</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              editable={!isSubmitting}
              onChangeText={setName}
              placeholder="Digite seu nome"
              placeholderTextColor="#4F7F98"
              style={styles.input}
              value={name}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              editable={!isSubmitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Digite seu email"
              placeholderTextColor="#4F7F98"
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              autoCapitalize="none"
              editable={!isSubmitting}
              onChangeText={setPassword}
              placeholder="Crie uma senha"
              placeholderTextColor="#4F7F98"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar Senha</Text>
            <TextInput
              autoCapitalize="none"
              editable={!isSubmitting}
              onChangeText={setConfirmPassword}
              placeholder="Confirme sua senha"
              placeholderTextColor="#4F7F98"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
            />
          </View>

          {!passwordsMatch && confirmPassword ? (
            <Text style={styles.errorText}>As senhas precisam ser iguais.</Text>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            disabled={isSubmitDisabled}
            onPress={handleRegister}
            style={[styles.button, isSubmitDisabled && styles.buttonDisabled]}
          >
            <Text style={[styles.buttonText, isSubmitDisabled && styles.buttonTextDisabled]}>
              {isSubmitting ? 'REGISTRANDO...' : 'REGISTRAR'}
            </Text>
          </Pressable>

          <Pressable onPress={() => onBack && onBack()} style={styles.backLinkWrapper}>
            <Text style={styles.backLink}>Voltar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: androidTopInset,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#1B1B1B',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginBottom: 46,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: '#4DA5F5',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    color: '#484848',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#2E84B6',
    borderRadius: 3,
    backgroundColor: '#56BDF2',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#183648',
  },
  errorText: {
    marginTop: 2,
    marginBottom: 6,
    textAlign: 'center',
    color: '#B3261E',
  },
  button: {
    alignSelf: 'center',
    minWidth: 144,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2E84B6',
    borderRadius: 4,
    backgroundColor: '#4DA5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    borderColor: '#A8A8A8',
    backgroundColor: '#D9D9D9',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#8F8F8F',
  },
  backLinkWrapper: {
    marginTop: 14,
    alignSelf: 'center',
  },
  backLink: {
    fontSize: 14,
    color: '#575757',
  },
});

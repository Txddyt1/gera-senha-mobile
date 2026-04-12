import React, { useEffect, useState } from 'react';
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

export default function SigninScream({ onNavigateToSignup, initialEmail = '' }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const isSubmitDisabled = !email.trim() || !password.trim() || isSubmitting;

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const result = await signIn({
      email,
      password,
    });

    if (!result?.ok) {
      setErrorMessage(result?.message || 'Nao foi possivel realizar o login.');
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
          <Text style={styles.headerTitle}>Signin</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>SIGN IN</Text>

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
              placeholder="Digite sua senha"
              placeholderTextColor="#4F7F98"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            disabled={isSubmitDisabled}
            onPress={handleSubmit}
            style={[styles.button, isSubmitDisabled && styles.buttonDisabled]}
          >
            <Text style={[styles.buttonText, isSubmitDisabled && styles.buttonTextDisabled]}>
              {isSubmitting ? 'ENTRANDO...' : 'ENTRAR'}
            </Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Não possui conta ainda? </Text>
            <Pressable onPress={() => onNavigateToSignup && onNavigateToSignup()}>
              <Text style={styles.footerLink}>Crie agora.</Text>
            </Pressable>
          </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginBottom: 72,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: '#4DA5F5',
  },
  fieldGroup: {
    marginBottom: 18,
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
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
    color: '#B3261E',
  },
  button: {
    alignSelf: 'center',
    minWidth: 128,
    marginTop: 16,
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
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#575757',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3A',
  },
});

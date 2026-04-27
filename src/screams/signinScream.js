import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
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
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: androidTopInset }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="h-14 justify-center border-b border-[#ECECEC] px-6">
          <Text className="text-[18px] font-semibold text-[#1B1B1B]">Signin</Text>
        </View>

        <View className="flex-1 justify-center px-8">
          <Text className="mb-[72px] text-center text-[26px] font-extrabold text-[#4DA5F5]">
            SIGN IN
          </Text>

          <View className="mb-[18px]">
            <Text className="mb-2 text-[16px] text-[#484848]">Email</Text>
            <TextInput
              autoCapitalize="none"
              className="h-[54px] rounded-[3px] border border-[#2E84B6] bg-[#56BDF2] px-[14px] text-[16px] text-[#183648]"
              editable={!isSubmitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Digite seu email"
              placeholderTextColor="#4F7F98"
              value={email}
            />
          </View>

          <View className="mb-[18px]">
            <Text className="mb-2 text-[16px] text-[#484848]">Senha</Text>
            <TextInput
              autoCapitalize="none"
              className="h-[54px] rounded-[3px] border border-[#2E84B6] bg-[#56BDF2] px-[14px] text-[16px] text-[#183648]"
              editable={!isSubmitting}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              placeholderTextColor="#4F7F98"
              secureTextEntry
              value={password}
            />
          </View>

          {errorMessage ? (
            <Text className="mb-1 mt-1 text-center text-[#B3261E]">{errorMessage}</Text>
          ) : null}

          <Pressable
            className={`mt-4 min-w-[128px] self-center rounded-[4px] border px-5 py-3 ${
              isSubmitDisabled
                ? 'border-[#A8A8A8] bg-[#D9D9D9]'
                : 'border-[#2E84B6] bg-[#4DA5F5]'
            }`}
            disabled={isSubmitDisabled}
            onPress={handleSubmit}
          >
            <Text
              className={`text-center text-[15px] font-bold ${
                isSubmitDisabled ? 'text-[#8F8F8F]' : 'text-white'
              }`}
            >
              {isSubmitting ? 'ENTRANDO...' : 'ENTRAR'}
            </Text>
          </Pressable>

          <View className="mt-[18px] flex-row items-center justify-center">
            <Text className="text-[13px] text-[#575757]">NÃ£o possui conta ainda? </Text>
            <Pressable onPress={() => onNavigateToSignup && onNavigateToSignup()}>
              <Text className="text-[13px] font-semibold text-[#3A3A3A]">Crie agora.</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

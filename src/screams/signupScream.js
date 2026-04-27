import React, { useState } from 'react';
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
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: androidTopInset }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="h-14 flex-row items-center border-b border-[#ECECEC] px-4">
          <Pressable className="w-10 justify-center" hitSlop={10} onPress={() => onBack && onBack()}>
            <Text className="text-[24px] text-[#1B1B1B]">{'<'}</Text>
          </Pressable>
          <Text className="flex-1 text-[18px] font-semibold text-[#1B1B1B]">Signup</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 justify-center px-8">
          <Text className="mb-[46px] text-center text-[26px] font-extrabold text-[#4DA5F5]">
            SIGN UP
          </Text>

          <View className="mb-[14px]">
            <Text className="mb-2 text-[16px] text-[#484848]">Nome</Text>
            <TextInput
              className="h-[54px] rounded-[3px] border border-[#2E84B6] bg-[#56BDF2] px-[14px] text-[16px] text-[#183648]"
              editable={!isSubmitting}
              onChangeText={setName}
              placeholder="Digite seu nome"
              placeholderTextColor="#4F7F98"
              value={name}
            />
          </View>

          <View className="mb-[14px]">
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

          <View className="mb-[14px]">
            <Text className="mb-2 text-[16px] text-[#484848]">Senha</Text>
            <TextInput
              autoCapitalize="none"
              className="h-[54px] rounded-[3px] border border-[#2E84B6] bg-[#56BDF2] px-[14px] text-[16px] text-[#183648]"
              editable={!isSubmitting}
              onChangeText={setPassword}
              placeholder="Crie uma senha"
              placeholderTextColor="#4F7F98"
              secureTextEntry
              value={password}
            />
          </View>

          <View className="mb-[14px]">
            <Text className="mb-2 text-[16px] text-[#484848]">Confirmar Senha</Text>
            <TextInput
              autoCapitalize="none"
              className="h-[54px] rounded-[3px] border border-[#2E84B6] bg-[#56BDF2] px-[14px] text-[16px] text-[#183648]"
              editable={!isSubmitting}
              onChangeText={setConfirmPassword}
              placeholder="Confirme sua senha"
              placeholderTextColor="#4F7F98"
              secureTextEntry
              value={confirmPassword}
            />
          </View>

          {!passwordsMatch && confirmPassword ? (
            <Text className="mb-1.5 mt-0.5 text-center text-[#B3261E]">
              As senhas precisam ser iguais.
            </Text>
          ) : null}

          {errorMessage ? (
            <Text className="mb-1.5 mt-0.5 text-center text-[#B3261E]">{errorMessage}</Text>
          ) : null}

          <Pressable
            className={`mt-3 min-w-[144px] self-center rounded-[4px] border px-5 py-3 ${
              isSubmitDisabled
                ? 'border-[#A8A8A8] bg-[#D9D9D9]'
                : 'border-[#2E84B6] bg-[#4DA5F5]'
            }`}
            disabled={isSubmitDisabled}
            onPress={handleRegister}
          >
            <Text
              className={`text-center text-[15px] font-bold ${
                isSubmitDisabled ? 'text-[#8F8F8F]' : 'text-white'
              }`}
            >
              {isSubmitting ? 'REGISTRANDO...' : 'REGISTRAR'}
            </Text>
          </Pressable>

          <Pressable className="mt-[14px] self-center" onPress={() => onBack && onBack()}>
            <Text className="text-[14px] text-[#575757]">Voltar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

import { GoogleIcon } from '../../components/ui/GoogleIcon';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle } = useApp();
  const [email, setEmail] = useState('alex.smith@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email);
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 20),
      }}
      className="flex-1 bg-[#F8FAF8]"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Logo & Subtitle */}
          <View className="items-center mb-8">
            <Logo
              size="lg"
              subText="Tumbuh bersama, memanen bahagia."
            />
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm shadow-black/5 border border-gray-100">
            {/* Segmented Switch: Masuk / Daftar */}
            <View className="flex-row bg-[#F3F4F6] p-1.5 rounded-2xl mb-6">
              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl bg-white shadow-xs items-center justify-center"
                activeOpacity={0.9}
              >
                <Text className="text-sm font-bold text-[#1C7430]">Masuk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                className="flex-1 py-2.5 rounded-xl items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-500">Daftar</Text>
              </TouchableOpacity>
            </View>

            {/* Email Input */}
            <Input
              label="Email"
              placeholder="nama@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color="#6B7280" />}
            />

            {/* Password Input */}
            <Input
              label="Kata Sandi"
              placeholder="••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color="#6B7280" />}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-xs font-semibold text-[#1C7430]">
                Lupa Kata Sandi?
              </Text>
            </TouchableOpacity>

            {/* Primary Login Button */}
            <Button
              title="Masuk"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              className="w-full mb-6"
            />

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="px-3 text-xs text-gray-400 font-medium">
                Atau masuk dengan
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Google OAuth Button */}
            <Button
              title="Google"
              variant="google"
              onPress={handleGoogleLogin}
              size="md"
              className="w-full"
              icon={<GoogleIcon size={20} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

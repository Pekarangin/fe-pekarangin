import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { GoogleIcon } from '../../components/ui/GoogleIcon';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const [, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId || 'unconfigured-client-id.apps.googleusercontent.com',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || googleClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      const idToken = googleResponse.params.id_token;
      loginWithGoogle(idToken)
        .then(() => router.replace('/(tabs)'))
        .catch((err: any) => {
          const msg = err?.message || 'Verifikasi token Google gagal di server.';
          setErrorMsg(msg);
          Alert.alert('Gagal Masuk Google', msg);
        });
    } else if (googleResponse?.type === 'error') {
      const msg = googleResponse.error?.message || 'Otorisasi Google gagal.';
      Alert.alert('Google Sign-In Error', msg);
    }
  }, [googleResponse, loginWithGoogle, router]);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Email atau kata sandi tidak valid';
      setErrorMsg(msg);
      Alert.alert('Gagal Masuk', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    if (!googleClientId) {
      Alert.alert(
        'Google Client ID Belum Dikonfigurasi',
        'Fitur login Google memerlukan Google OAuth Client ID resmi dari Google Cloud Console.\n\nHarap daftarkan EXPO_PUBLIC_GOOGLE_CLIENT_ID di file .env dan cocokkan dengan GOOGLE_CLIENT_ID di backend server agar token dapat diverifikasi.',
        [{ text: 'Tutup' }]
      );
      return;
    }

    try {
      await promptGoogleAsync();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Gagal membuka Google Sign-In.';
      setErrorMsg(msg);
      Alert.alert('Google Sign-In Error', msg);
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

            {errorMsg ? (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4">
                <Text className="text-xs text-red-600 font-semibold text-center">{errorMsg}</Text>
              </View>
            ) : null}

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

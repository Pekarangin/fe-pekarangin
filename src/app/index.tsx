import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/ui/Logo';
import { useApp } from '../context/AppContext';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rootNavigationState = useRootNavigationState();
  const { isOnboarded, isAuthenticated } = useApp();
  const navigatedRef = useRef(false);

  const performNavigation = useCallback(() => {
    if (navigatedRef.current) return;
    if (!rootNavigationState?.key) return;

    navigatedRef.current = true;
    if (!isOnboarded) {
      router.replace('/onboarding');
    } else if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [rootNavigationState?.key, isOnboarded, isAuthenticated, router]);

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const timer = setTimeout(() => {
      performNavigation();
    }, 600);

    return () => clearTimeout(timer);
  }, [rootNavigationState?.key, performNavigation]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={performNavigation}
      style={{
        paddingTop: Math.max(insets.top, 24),
        paddingBottom: Math.max(insets.bottom, 24),
      }}
      className="flex-1 bg-[#F4F8F4] justify-between items-center px-6"
    >
      {/* Top spacer */}
      <View />

      {/* Center Logo */}
      <View className="items-center justify-center">
        <Logo size="xl" showText={true} />
        <View className="mt-8">
          <ActivityIndicator size="small" color="#1C7430" />
        </View>
      </View>

      {/* Bottom Tagline */}
      <View className="items-center pb-4">
        <Text className="text-sm font-medium text-gray-600 text-center leading-relaxed">
          Suburkan Pekarangan, Hemat{'\n'}Belanja, Hijaukan Kota
        </Text>
      </View>
    </TouchableOpacity>
  );
}

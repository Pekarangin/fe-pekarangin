import React, { useState } from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { Home, Trees, Sparkles, Leaf, User } from 'lucide-react-native';
import { View, Modal, TouchableOpacity, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import { FeatureTourCoachmark, TourStep } from '../../components/dashboard/FeatureTourCoachmark';

const STEP_ROUTES: Record<TourStep, any> = {
  1: '/(tabs)',
  2: '/(tabs)/lahan',
  3: '/(tabs)/rekomendasi',
  4: '/(tabs)/tracking',
  5: '/(tabs)',
};

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isOnboarded, isTourActive, tourStep, setTourStep, skipTour } = useApp();
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const handleNext = () => {
    if (tourStep < 5) {
      const next = (tourStep + 1) as TourStep;
      setTourStep(next);
      router.push(STEP_ROUTES[next]);
    } else {
      skipTour();
      setShowCompletionModal(true);
      router.push('/(tabs)');
    }
  };

  const handlePrev = () => {
    if (tourStep > 1) {
      const prev = (tourStep - 1) as TourStep;
      setTourStep(prev);
      router.push(STEP_ROUTES[prev]);
    }
  };

  const handleStepPress = (targetStep: TourStep) => {
    setTourStep(targetStep);
    router.push(STEP_ROUTES[targetStep]);
  };

  const handleSkip = () => {
    skipTour();
    router.push('/(tabs)');
  };

  // Route Guard: If not onboarded -> go to onboarding
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // Route Guard: If not authenticated -> go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1C7430',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Home size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lahan"
        options={{
          title: 'Lahan',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Trees size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rekomendasi"
        options={{
          title: 'Rekomendasi',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Sparkles size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Leaf size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <User size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>

    {/* Global Interactive Page Explorer Tour Coachmark */}
    {isTourActive && (
      <FeatureTourCoachmark
        step={tourStep}
        totalSteps={5}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onStepPress={handleStepPress}
      />
    )}

    {/* Completion Modal */}
    <Modal
      visible={showCompletionModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCompletionModal(false)}
    >
      <View className="flex-1 bg-black/65 justify-center items-center px-5">
        <View
          style={{
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            elevation: 20,
          }}
          className="bg-[#0A381F] border border-emerald-400/40 rounded-3xl p-6 w-full max-w-sm items-center"
        >
          <View className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 items-center justify-center mb-3.5">
            <Sparkles size={32} color="#34D399" />
          </View>

          <View className="bg-emerald-900/90 border border-emerald-500/40 px-3.5 py-1 rounded-full mb-2">
            <Text className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">
              Tur Halaman Selesai 🎉
            </Text>
          </View>

          <Text className="text-xl font-black text-white text-center mb-1">
            Siap Eksplorasi Pekarangan!
          </Text>

          <Text className="text-xs text-emerald-100/85 text-center leading-relaxed mb-5 px-1">
            Anda telah mengenal seluruh navigasi: Beranda, Lahan, Rekomendasi, Tracking, dan Asisten AI 24/7.
          </Text>

          {/* Quick checklist recap */}
          <View className="w-full bg-emerald-950/70 border border-emerald-800/60 rounded-2xl p-3 mb-5">
            <Text className="text-[11px] font-bold text-emerald-300 mb-1.5">
              5 Fitur Utama Siap Digunakan:
            </Text>
            <Text className="text-[11px] text-emerald-100/90 leading-relaxed font-medium">
              ✓ Pantau cuaca & hemat belanja di Beranda{'\n'}
              ✓ Atur luas & sinar matahari di Lahan{'\n'}
              ✓ Pilih sayuran berbobot ekonomi di Rekomendasi{'\n'}
              ✓ Catat siram, pupuk & panen di Tracking{'\n'}
              ✓ Konsultasi hama & daun menguning di Pekarang AI
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowCompletionModal(false)}
            activeOpacity={0.85}
            className="w-full bg-emerald-500 py-3.5 rounded-2xl items-center justify-center border border-emerald-300/40 shadow-sm"
          >
            <Text className="text-xs font-black text-white">
              Mulai Kelola Pekarangan Sekarang 🌱
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
  );
}

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Home,
  Trees,
  Sparkles,
  Leaf,
  Bot,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TourStep = 1 | 2 | 3 | 4 | 5;

export interface TourStepItem {
  icon: any;
  iconColor: string;
  themeColor: string;
  badge: string;
  targetTabName: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  nextLabel: string;
  tabPointerPercent: number; // 0 to 100% horizontal position
}

export const TOUR_STEPS_DATA: Record<TourStep, TourStepItem> = {
  1: {
    icon: Home,
    iconColor: '#34D399',
    themeColor: '#10B981',
    badge: 'LANGKAH 1 DARI 5',
    targetTabName: 'Tab Beranda',
    title: 'Pusat Kendali Pekarangan',
    subtitle: 'Ringkasan produktivitas & cuaca',
    description:
      'Halaman utama untuk memantau cuaca wilayah Anda secara real-time, akumulasi rupiah hemat belanja dapur, serta tugas checklist harian.',
    tags: ['🌤️ Cuaca Realtime', '💰 Hemat Belanja', '📋 Checklist Harian'],
    nextLabel: 'Jelajahi Lahan',
    tabPointerPercent: 10,
  },
  2: {
    icon: Trees,
    iconColor: '#4ADE80',
    themeColor: '#22C55E',
    badge: 'LANGKAH 2 DARI 5',
    targetTabName: 'Tab Lahan',
    title: 'Sketsa & Analisis Sinar',
    subtitle: 'Pemetaan ruang & pencahayaan',
    description:
      'Tentukan luas pekarangan (m²) dan intensitas sinar matahari (penuh, sebagian, atau teduh). Data ini menjadi dasar perhitungan AI untuk memilih komoditas.',
    tags: ['📐 Luas Pekarangan', '☀️ Analisis Sinar', '🌿 Potensi RTH'],
    nextLabel: 'Jelajahi Rekomendasi',
    tabPointerPercent: 30,
  },
  3: {
    icon: Sparkles,
    iconColor: '#FBBF24',
    themeColor: '#F59E0B',
    badge: 'LANGKAH 3 DARI 5',
    targetTabName: 'Tab Rekomendasi',
    title: 'Katalog Komoditas AI',
    subtitle: 'Rekomendasi sayuran berbobot ekonomi',
    description:
      'AI menganalisis sayuran paling adaptif dengan pekarangan Anda. Lihat estimasi nilai rupiah penghematan dan tanam langsung ke daftar pemantauan.',
    tags: ['🤖 Algoritma AI', '💵 Estimasi Rupiah', '🌱 1-Klik Tanam'],
    nextLabel: 'Jelajahi Tracking',
    tabPointerPercent: 50,
  },
  4: {
    icon: Leaf,
    iconColor: '#60A5FA',
    themeColor: '#3B82F6',
    badge: 'LANGKAH 4 DARI 5',
    targetTabName: 'Tab Tracking',
    title: 'Rawat Harian & Catat Panen',
    subtitle: 'Pantau siklus hidup dari semai ke panen',
    description:
      'Catat jadwal siram & pupuk tiap hari, pantau perkembangan 4 fase pertumbuhan tanaman, dan rekap timbangan hasil panen segar keluarga Anda.',
    tags: ['💧 Pengingat Siram', '📈 4 Fase Tumbuh', '🧺 Catat Panen'],
    nextLabel: 'Jelajahi Konsultasi AI',
    tabPointerPercent: 70,
  },
  5: {
    icon: Bot,
    iconColor: '#A7F3D0',
    themeColor: '#10B981',
    badge: 'FITUR SPESIAL 5 DARI 5',
    targetTabName: 'Pekarang AI Bot',
    title: 'Asisten Agronomis 24/7',
    subtitle: 'Konsultasi masalah tanaman seketika',
    description:
      'Punya keluhan daun menguning, serangan hama, atau bingung dosis pupuk organik? Cukup ketuk tombol bot melayang di kanan bawah untuk tanya jawab instan.',
    tags: ['🩺 Diagnosis Hama', '💊 Resep Pupuk', '💬 Tanya Jawab AI'],
    nextLabel: 'Selesai Tur & Mulai! 🎉',
    tabPointerPercent: 88,
  },
};

export interface FeatureTourCoachmarkProps {
  step: TourStep;
  totalSteps?: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onStepPress?: (step: TourStep) => void;
}

export const FeatureTourCoachmark: React.FC<FeatureTourCoachmarkProps> = ({
  step,
  totalSteps = 5,
  onNext,
  onPrev,
  onSkip,
  onStepPress,
}) => {
  const insets = useSafeAreaInsets();
  const current = TOUR_STEPS_DATA[step];
  const IconComponent = current.icon;
  const isStep5 = step === 5;

  // Animation values stored via useState initializer to satisfy react-hooks/refs
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(14));
  const [scaleAnim] = useState(() => new Animated.Value(0.97));
  const [progressAnim] = useState(() => new Animated.Value(step / totalSteps));
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Trigger smooth enter/change animation on step transition
  useEffect(() => {
    fadeAnim.setValue(0);
    // Slide in from top on step 5, from bottom on steps 1-4
    slideAnim.setValue(isStep5 ? -14 : 14);
    scaleAnim.setValue(0.97);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: step / totalSteps,
        duration: 280,
        useNativeDriver: false,
      }),
    ]).start();
  }, [step, isStep5, totalSteps, fadeAnim, slideAnim, scaleAnim, progressAnim]);

  // Subtle continuous breathing loop on the main call-to-action
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const topPadding = isStep5 ? Math.max(insets.top + 16, 44) : 0;
  const bottomPadding = isStep5 ? 0 : 74;

  const progressWidthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        justifyContent: isStep5 ? 'flex-start' : 'flex-end',
      }}
    >
      {/* Soft translucent backdrop overlay to focus attention */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 20, 12, 0.45)',
        }}
      />

      {/* Main Tour Card Container */}
      <Animated.View
        style={{
          paddingHorizontal: 16,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <View
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.5,
            shadowRadius: 22,
            elevation: 20,
            backgroundColor: '#072E18',
            borderColor: 'rgba(52, 211, 153, 0.35)',
            borderWidth: 1.5,
            borderRadius: 28,
            overflow: 'hidden',
          }}
          className="p-4"
        >
          {/* Top Progress Bar Track */}
          <View className="h-1 w-full bg-emerald-950 rounded-full mb-3 overflow-hidden">
            <Animated.View
              style={{
                height: '100%',
                width: progressWidthInterpolation,
                backgroundColor: '#34D399',
                borderRadius: 99,
              }}
            />
          </View>

          {/* Top Bar: Badge, Target Indicator & Skip Button */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="flex-row items-center bg-emerald-900/90 px-2.5 py-1 rounded-full border border-emerald-400/30 mr-2">
                <Compass size={11} color="#34D399" />
                <Text className="text-[10px] font-black text-emerald-200 ml-1.5 uppercase tracking-wider">
                  {current.badge}
                </Text>
              </View>

              <View className="bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/40">
                <Text className="text-[10px] font-bold text-emerald-300">
                  {current.targetTabName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onSkip}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="flex-row items-center bg-white/10 px-2.5 py-1 rounded-full border border-white/15"
            >
              <Text className="text-[10px] font-bold text-emerald-100 mr-1">
                Lewati
              </Text>
              <X size={11} color="#D1FAE5" />
            </TouchableOpacity>
          </View>

          {/* Title, Subtitle & Icon */}
          <View className="flex-row items-start mb-2.5">
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderColor: 'rgba(255, 255, 255, 0.18)',
                borderWidth: 1,
              }}
              className="w-10 h-10 rounded-2xl items-center justify-center mr-3 mt-0.5 shadow-xs"
            >
              <IconComponent size={22} color={current.iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-black text-white leading-tight">
                {current.title}
              </Text>
              <Text className="text-[11px] font-medium text-emerald-300/90 mt-0.5">
                {current.subtitle}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-[11.5px] text-emerald-100/85 leading-relaxed font-normal mb-3 px-0.5">
            {current.description}
          </Text>

          {/* Feature Highlights Chips */}
          <View className="flex-row flex-wrap gap-1.5 mb-3.5">
            {current.tags.map((tag, idx) => (
              <View
                key={idx}
                className="bg-emerald-950/80 border border-emerald-600/30 px-2 py-1 rounded-lg"
              >
                <Text className="text-[10px] font-semibold text-emerald-200">
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          {/* Bottom Bar: Interactive Stepper Dots & Action Buttons */}
          <View className="flex-row items-center justify-between pt-2.5 border-t border-emerald-900/70">
            {/* Interactive Step Jump Dots */}
            <View className="flex-row items-center">
              {([1, 2, 3, 4, 5] as TourStep[]).map(s => {
                const isActive = s === step;
                const isPassed = s < step;
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.7}
                    onPress={() => onStepPress && onStepPress(s)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    style={{
                      height: 7,
                      width: isActive ? 24 : 7,
                      borderRadius: 4,
                      backgroundColor: isActive
                        ? '#34D399'
                        : isPassed
                        ? '#059669'
                        : 'rgba(255, 255, 255, 0.2)',
                      marginRight: 5,
                    }}
                  />
                );
              })}
            </View>

            {/* Navigation Controls */}
            <View className="flex-row items-center">
              {step > 1 && (
                <TouchableOpacity
                  onPress={onPrev}
                  activeOpacity={0.75}
                  className="mr-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex-row items-center"
                >
                  <ChevronLeft size={13} color="#FFFFFF" />
                  <Text className="text-[11px] font-bold text-white ml-0.5">
                    Kembali
                  </Text>
                </TouchableOpacity>
              )}

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  onPress={onNext}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: isStep5 ? '#10B981' : '#059669',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 5,
                  }}
                  className="px-3.5 py-1.5 rounded-xl flex-row items-center border border-emerald-300/40"
                >
                  <Text className="text-[11px] font-black text-white mr-1">
                    {current.nextLabel}
                  </Text>
                  <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* On step 5: Floating downward callout banner pointing to bottom-right FAB */}
        {isStep5 && (
          <View className="items-end mt-3 pr-2">
            <View
              style={{
                backgroundColor: '#072E18',
                borderColor: '#34D399',
                borderWidth: 1.5,
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 6,
              }}
              className="px-3.5 py-2 rounded-2xl flex-row items-center"
            >
              <Sparkles size={13} color="#34D399" />
              <Text className="text-[11px] font-extrabold text-emerald-200 ml-1.5">
                Tombol AI aktif di pojok kanan bawah 👇
              </Text>
            </View>
          </View>
        )}

        {/* Tab Pointer Indicator Arrow pointing down to active tab on steps 1-4 */}
        {!isStep5 && (
          <View
            style={{
              position: 'absolute',
              bottom: 64,
              left: `${current.tabPointerPercent}%`,
              transform: [{ translateX: -10 }],
            }}
          >
            <View
              style={{
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 10,
                borderRightWidth: 10,
                borderTopWidth: 10,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: '#072E18',
              }}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};


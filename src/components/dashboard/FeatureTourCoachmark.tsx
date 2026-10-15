import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import {
  Home,
  Trees,
  Sparkles,
  Bot,
  Leaf,
  ChevronRight,
  X,
  Compass,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export type TourStep = 1 | 2 | 3 | 4 | 5;

export interface SimpleTourItem {
  id: TourStep;
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  tag: string;
  description: string;
  route: string;
}

export const TOUR_ITEMS: SimpleTourItem[] = [
  {
    id: 1,
    icon: Home,
    iconBg: 'bg-emerald-100',
    iconColor: '#166534',
    title: 'Beranda Cerdas',
    tag: 'Live Cuaca',
    description: 'Pantau cuaca lokal, total hemat belanja dapur, dan checklist harian.',
    route: '/(tabs)',
  },
  {
    id: 2,
    icon: Trees,
    iconBg: 'bg-green-100',
    iconColor: '#15803D',
    title: 'Analisis Pekarangan',
    tag: 'Grid 8x8 & Kamera',
    description: 'Petakan ukuran pekarangan dan deteksi sinar matahari via Gemini Vision AI.',
    route: '/(tabs)/lahan',
  },
  {
    id: 3,
    icon: Sparkles,
    iconBg: 'bg-amber-100',
    iconColor: '#B45309',
    title: 'Rekomendasi Tanaman',
    tag: 'Hemat Belanja',
    description: 'Sayuran paling cocok dari data pasar lokal Sleman/DIY dengan aksi 1-klik tanam.',
    route: '/(tabs)/rekomendasi',
  },
  {
    id: 4,
    icon: Bot,
    iconBg: 'bg-teal-100',
    iconColor: '#0F766E',
    title: 'Chatbot Agronomis 24/7',
    tag: 'Konsultasi AI',
    description: 'Tanya kendala hama, daun menguning, dan nutrisi organik kapan saja.',
    route: '/(tabs)/chatbot',
  },
  {
    id: 5,
    icon: Leaf,
    iconBg: 'bg-blue-100',
    iconColor: '#1D4ED8',
    title: 'Tracking & Panen',
    tag: 'Jadwal Rawat',
    description: 'Catat siram, pupuk, pantau 4 fase tumbuh, dan rekap timbangan hasil panen.',
    route: '/(tabs)/tracking',
  },
];

export interface FeatureTourCoachmarkProps {
  visible?: boolean;
  step?: TourStep;
  totalSteps?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onStepPress?: (step: TourStep) => void;
}

export function FeatureTourCoachmark({
  visible = true,
  onSkip,
}: FeatureTourCoachmarkProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleOpenFeature = (route: string) => {
    if (onSkip) onSkip();
    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View className="flex-1 bg-black/70 justify-end">
        <View
          style={{
            maxHeight: '90%',
            paddingBottom: Math.max(insets.bottom, 24),
          }}
          className="bg-white rounded-t-[36px] w-full p-6 shadow-2xl"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
            <View style={{ gap: 10 }} className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 items-center justify-center">
                <Compass size={20} color="#166534" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-gray-900 tracking-tight">
                  Tur Fitur Pekarang.in
                </Text>
                <Text className="text-xs text-gray-500 font-medium">
                  5 fitur utama untuk mandiri pangan keluarga
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onSkip}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Simple Readable Feature Cards */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-[420px] mb-4"
          >
            <View style={{ gap: 10 }}>
              {TOUR_ITEMS.map((item, index) => {
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleOpenFeature(item.route)}
                    activeOpacity={0.8}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex-row items-center justify-between"
                  >
                    <View style={{ gap: 12 }} className="flex-row items-start flex-1 mr-2">
                      <View className={`w-10 h-10 rounded-2xl ${item.iconBg} items-center justify-center mt-0.5`}>
                        <IconComp size={20} color={item.iconColor} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-sm font-black text-gray-900">
                            {index + 1}. {item.title}
                          </Text>
                          <View className="bg-white px-2 py-0.5 rounded-full border border-gray-200">
                            <Text className="text-[9px] font-bold text-gray-600">
                              {item.tag}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-gray-600 leading-relaxed font-medium">
                          {item.description}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom Primary Button */}
          <TouchableOpacity
            onPress={onSkip}
            activeOpacity={0.85}
            className="w-full bg-[#124E2A] py-3.5 rounded-2xl items-center justify-center shadow-xs"
          >
            <Text className="text-xs font-black text-white">
              Mulai Jelajahi Pekarangan Sekarang 🌱
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default FeatureTourCoachmark;

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Leaf, Trees, ChevronLeft } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Bertani di Halaman\nSendiri',
    description:
      'Manfaatkan lahan terbatas untuk menanam sayuran segar dan sehat langsung dari rumah Anda.',
    illustrationType: 'garden',
    badgeText: 'SMART URBAN GARDEN',
  },
  {
    id: 2,
    title: 'Hemat Biaya Dapur',
    description:
      'Kurangi pengeluaran belanja harian dengan memanen hasil kebun sendiri. Lebih hemat, lebih segar.',
    illustrationType: 'growth',
    badgeText: 'FINANCIAL GROWTH',
  },
  {
    id: 3,
    title: 'Hijaukan Kota Kita',
    description:
      'Setiap tanaman berkontribusi pada lingkungan yang lebih bersih dan udara yang lebih segar bagi semua.',
    illustrationType: 'city',
    badgeText: 'ECO-FUTURE CITIES',
    badgeSub: 'ENVIRONMENTAL IMPACT',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setIsOnboarded } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
      setCurrentStep(nextStep);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
      setCurrentStep(prevStep);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentStep && index >= 0 && index < ONBOARDING_STEPS.length) {
      setCurrentStep(index);
    }
  };

  const goToStep = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentStep(index);
  };

  const finishOnboarding = () => {
    setIsOnboarded(true);
    router.replace('/(auth)/login');
  };

  const renderItem = ({ item }: { item: typeof ONBOARDING_STEPS[0] }) => (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="px-6 justify-center items-center py-4"
    >
      {/* Illustration Card Container with spacious layout */}
      <View className="w-full max-w-[340px] aspect-square rounded-3xl bg-[#F4F6F4] items-center justify-center p-8 border border-gray-100 shadow-sm shadow-black/5 mb-6">
        {item.illustrationType === 'garden' && (
          <View className="items-center justify-center">
            <View className="w-48 h-48 rounded-2xl bg-white/90 items-center justify-center border border-green-100 shadow-sm p-4">
              <Trees size={68} color="#1C7430" />
              <View className="flex-row mt-4 space-x-3">
                <View className="w-10 h-7 bg-green-100 rounded-lg items-center justify-center">
                  <Leaf size={15} color="#1C7430" />
                </View>
                <View className="w-10 h-7 bg-green-100 rounded-lg items-center justify-center">
                  <Leaf size={15} color="#1C7430" />
                </View>
              </View>
            </View>
            <Text className="text-[10px] font-bold text-green-800 uppercase tracking-widest mt-4">
              {item.badgeText}
            </Text>
          </View>
        )}

        {item.illustrationType === 'growth' && (
          <View className="items-center justify-center">
            <View className="w-44 h-44 rounded-full bg-[#E8F5E9] items-center justify-center border-4 border-white shadow-sm">
              <View className="w-28 h-28 rounded-full bg-[#C8E6C9] items-center justify-center shadow-inner">
                <Leaf size={52} color="#1C7430" fill="#1C7430" />
              </View>
            </View>
            <Text className="text-xs font-bold text-[#1C7430] uppercase tracking-wider mt-5">
              {item.badgeText}
            </Text>
          </View>
        )}

        {item.illustrationType === 'city' && (
          <View className="items-center justify-center">
            <View className="w-48 h-44 rounded-2xl bg-white/90 items-center justify-center border border-green-100 p-4 shadow-sm">
              <View className="items-center justify-center">
                <Trees size={58} color="#1C7430" />
                <View className="flex-row items-center mt-3 space-x-2">
                  <View className="w-7 h-11 bg-gray-200 rounded-t-md" />
                  <View className="w-10 h-16 bg-green-700 rounded-t-md items-center justify-center">
                    <Leaf size={14} color="#FFFFFF" />
                  </View>
                  <View className="w-7 h-12 bg-gray-300 rounded-t-md" />
                </View>
              </View>
            </View>
            <Text className="text-xs font-bold text-gray-900 uppercase tracking-wider mt-4">
              {item.badgeText}
            </Text>
            {item.badgeSub && (
              <Text className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
                {item.badgeSub}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Text Content */}
      <View className="items-center px-4 mt-2">
        <Text className="text-2xl font-extrabold text-gray-900 text-center leading-tight">
          {item.title}
        </Text>
        <Text className="text-sm font-normal text-gray-600 text-center mt-3 leading-relaxed max-w-[300px]">
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 20),
      }}
      className="flex-1 bg-[#F8FAF8]"
    >
      <View className="flex-1 justify-between py-4">
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-6 pt-2">
          <View className="flex-row items-center">
            {currentStep > 0 && (
              <TouchableOpacity
                onPress={handlePrev}
                className="mr-2 p-1.5 rounded-full bg-white border border-gray-200"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={20} color="#1C7430" />
              </TouchableOpacity>
            )}
            <View className="flex-row items-center space-x-1.5">
              <Leaf size={24} color="#1C7430" fill="#1C7430" />
              <Text className="text-2xl font-extrabold text-[#1C7430] ml-1 tracking-tight">
                Pekarang.In
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={finishOnboarding}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-base font-semibold text-gray-700">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Swipeable Carousel */}
        <View className="flex-1 justify-center">
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_STEPS}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="center"
          />
        </View>

        {/* Bottom Area: Pagination & CTA Button */}
        <View className="w-full px-6 space-y-6 pb-2">
          {/* Pagination Indicators with distinct spacing */}
          <View className="flex-row justify-center items-center py-2 mb-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToStep(index)}
                hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                style={{ marginHorizontal: 6 }}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-[#1C7430]'
                    : 'w-2.5 bg-gray-300'
                }`}
              />
            ))}
          </View>

          {/* CTA Button */}
          <Button
            title={currentStep === ONBOARDING_STEPS.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}
            onPress={handleNext}
            size="lg"
            className="w-full shadow-sm"
          />
        </View>
      </View>
    </View>
  );
}

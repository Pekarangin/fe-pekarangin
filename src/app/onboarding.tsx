import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Leaf, ChevronLeft } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Bertani di Halaman\nSendiri',
    description:
      'Manfaatkan lahan terbatas untuk menanam sayuran segar dan sehat langsung dari rumah Anda.',
    image: require('../../assets/images/onboarding/onboarding1.png'),
    badgeText: 'SMART URBAN GARDEN',
  },
  {
    id: 2,
    title: 'Hemat Biaya Dapur',
    description:
      'Kurangi pengeluaran belanja harian dengan memanen hasil kebun sendiri. Lebih hemat, lebih segar.',
    image: require('../../assets/images/onboarding/onboarding2.png'),
    badgeText: 'FINANCIAL GROWTH',
  },
  {
    id: 3,
    title: 'Hijaukan Kota Kita',
    description:
      'Setiap tanaman berkontribusi pada lingkungan yang lebih bersih dan udara yang lebih segar bagi semua.',
    image: require('../../assets/images/onboarding/onboarding3.png'),
    badgeText: 'ECO-FUTURE CITIES',
    badgeSub: 'ENVIRONMENTAL IMPACT',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setIsOnboarded, isOnboarded, isAuthenticated } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else if (isOnboarded) {
      router.replace('/(auth)/login');
    }
  }, [isOnboarded, isAuthenticated, router]);

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
      {/* Illustration Card Container with real onboarding images */}
      <View className="w-full max-w-[340px] aspect-square rounded-3xl bg-white items-center justify-center p-6 border border-gray-100 shadow-sm shadow-black/5 mb-6 overflow-hidden">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="contain"
        />
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

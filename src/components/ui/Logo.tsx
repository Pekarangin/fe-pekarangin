import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  Easing,
  StyleSheet,
  Platform,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';

const APP_LOGO_IMG = require('../../../assets/images/splash-icon.png');

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  subText?: string;
  interactive?: boolean;
  onPress?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textColor = '#166534',
  subText,
  interactive = true,
  onPress,
}) => {
  const iconBoxSize =
    size === 'sm' ? 44 : size === 'md' ? 64 : size === 'lg' ? 88 : 124;
  const textSize =
    size === 'sm'
      ? 'text-lg'
      : size === 'md'
      ? 'text-2xl'
      : size === 'lg'
      ? 'text-3xl'
      : 'text-4xl';

  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [particleAnim] = useState(() => new Animated.Value(0));
  const [showParticle, setShowParticle] = useState(false);

  const useNativeDriver = Platform.OS !== 'web';

  const handlePress = () => {
    if (!interactive) return;

    // 1. Spring scale pop
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 90,
        easing: Easing.ease,
        useNativeDriver,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3.5,
        tension: 160,
        useNativeDriver,
      }),
    ]).start();

    // 2. Floating growth sparkle effect
    setShowParticle(true);
    particleAnim.setValue(0);
    Animated.timing(particleAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.quad),
      useNativeDriver,
    }).start(() => {
      setShowParticle(false);
    });

    if (onPress) {
      onPress();
    }
  };

  const particleTranslateY = useMemo(
    () =>
      particleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -32],
      }),
    [particleAnim]
  );

  const particleOpacity = useMemo(
    () =>
      particleAnim.interpolate({
        inputRange: [0, 0.2, 0.7, 1],
        outputRange: [0, 1, 0.9, 0],
      }),
    [particleAnim]
  );

  const particleScale = useMemo(
    () =>
      particleAnim.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0.6, 1.25, 0.9],
      }),
    [particleAnim]
  );

  const borderRadius = Math.round(iconBoxSize * 0.24);

  return (
    <View className="items-center justify-center">
      {/* Official App Logo Icon Badge */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        disabled={!interactive}
        className="items-center justify-center"
        style={Platform.OS === 'web' ? ({ cursor: interactive ? 'pointer' : 'default' } as any) : undefined}
      >
        <Animated.View
          style={[
            styles.badgeShadow,
            {
              width: iconBoxSize,
              height: iconBoxSize,
              borderRadius,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          className="items-center justify-center relative overflow-hidden bg-[#166534]"
        >
          <Image
            source={APP_LOGO_IMG}
            style={{
              width: iconBoxSize,
              height: iconBoxSize,
              borderRadius,
            }}
            resizeMode="cover"
          />

          {/* Floating Sparkle Particle on Tap */}
          {showParticle && (
            <Animated.View
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                opacity: particleOpacity,
                transform: [
                  { translateY: particleTranslateY },
                  { scale: particleScale },
                ],
              }}
              pointerEvents="none"
              className="flex-row items-center bg-emerald-600 px-2 py-0.5 rounded-full shadow-md z-10"
            >
              <Sparkles size={11} color="#FEF08A" />
              <Text className="text-[10px] font-black text-white ml-0.5">🌱 +1</Text>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Typography Brand Title */}
      {showText && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          disabled={!interactive}
          className="items-center mt-3"
          style={Platform.OS === 'web' ? ({ cursor: interactive ? 'pointer' : 'default', userSelect: 'none' } as any) : undefined}
        >
          <View className="flex-row items-center justify-center">
            <Text
              style={{ color: textColor }}
              className={`${textSize} font-black tracking-tight text-center`}
            >
              Pekarang<Text className="text-emerald-600">.In</Text>
            </Text>
          </View>
          {subText && (
            <Text className="text-xs font-semibold text-gray-500 text-center mt-1 max-w-[280px] leading-relaxed">
              {subText}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeShadow: {
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 24px -4px rgba(22, 101, 52, 0.25)',
        } as any)
      : {}),
  },
});

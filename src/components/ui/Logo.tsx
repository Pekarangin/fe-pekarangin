import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Easing,
  StyleSheet,
} from 'react-native';
import { Leaf, Sparkles } from 'lucide-react-native';

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
    size === 'sm' ? 40 : size === 'md' ? 52 : size === 'lg' ? 72 : 86;
  const letterSize =
    size === 'sm' ? 20 : size === 'md' ? 26 : size === 'lg' ? 36 : 44;
  const leafIconSize =
    size === 'sm' ? 14 : size === 'md' ? 18 : size === 'lg' ? 24 : 28;
  const textSize =
    size === 'sm'
      ? 'text-lg'
      : size === 'md'
      ? 'text-2xl'
      : size === 'lg'
      ? 'text-3xl'
      : 'text-4xl';

  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [idleRotateAnim] = useState(() => new Animated.Value(0));
  const [tapRotateAnim] = useState(() => new Animated.Value(0));
  const [particleAnim] = useState(() => new Animated.Value(0));
  const [showParticle, setShowParticle] = useState(false);

  // Idle gentle leaf breeze loop
  useEffect(() => {
    const breezeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleRotateAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idleRotateAnim, {
          toValue: -1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breezeLoop.start();
    return () => breezeLoop.stop();
  }, [idleRotateAnim]);

  const handlePress = () => {
    if (!interactive) return;

    // 1. Spring scale pop
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 80,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3.5,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Playful leaf spin wobble
    tapRotateAnim.setValue(0);
    Animated.sequence([
      Animated.timing(tapRotateAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.back(2.2)),
        useNativeDriver: true,
      }),
      Animated.spring(tapRotateAnim, {
        toValue: 0,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Floating growth sparkle effect
    setShowParticle(true);
    particleAnim.setValue(0);
    Animated.timing(particleAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowParticle(false);
    });

    if (onPress) {
      onPress();
    }
  };

  const idleRotation = useMemo(
    () =>
      idleRotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-6deg', '12deg', '22deg'],
      }),
    [idleRotateAnim]
  );

  const tapRotation = useMemo(
    () =>
      tapRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
      }),
    [tapRotateAnim]
  );

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

  return (
    <View className="items-center justify-center">
      {/* Interactive Badge Container */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        disabled={!interactive}
        className="items-center justify-center"
      >
        <Animated.View
          style={[
            styles.badgeShadow,
            {
              width: iconBoxSize,
              height: iconBoxSize,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          className="items-center justify-center rounded-3xl bg-white border-2 border-emerald-100 mb-2 relative"
        >
          {/* Letter P and Sprouting Leaf */}
          <View className="relative items-center justify-center">
            <Text
              style={{ fontSize: letterSize }}
              className="font-black text-[#1C7430] tracking-tighter"
            >
              P
            </Text>

            {/* Dynamic Sprout Leaf */}
            <Animated.View
              style={{
                position: 'absolute',
                top: -leafIconSize * 0.45,
                right: -leafIconSize * 0.55,
                transform: [
                  { rotate: idleRotation },
                  { rotate: tapRotation },
                ],
              }}
            >
              <Leaf size={leafIconSize} color="#EA580C" fill="#EA580C" />
            </Animated.View>
          </View>

          {/* Floating Sparkle Particle on Tap */}
          {showParticle && (
            <Animated.View
              style={{
                position: 'absolute',
                top: -10,
                right: -12,
                opacity: particleOpacity,
                transform: [
                  { translateY: particleTranslateY },
                  { scale: particleScale },
                ],
              }}
              pointerEvents="none"
              className="flex-row items-center bg-emerald-600 px-2 py-0.5 rounded-full shadow-sm"
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
          className="items-center"
        >
          <View className="flex-row items-center">
            <Leaf
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
              color="#1C7430"
              fill="#1C7430"
            />
            <Text
              style={{ color: textColor }}
              className={`${textSize} font-black tracking-tight ml-1.5`}
            >
              Pekarang.In
            </Text>
          </View>
          {subText && (
            <Text className="text-xs font-medium text-gray-500 text-center mt-1.5 max-w-[280px]">
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
});

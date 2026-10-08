import React from 'react';
import { View, Text } from 'react-native';
import { Leaf } from 'lucide-react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  subText?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textColor = '#166534',
  subText,
}) => {
  const iconBoxSize =
    size === 'sm' ? 36 : size === 'md' ? 48 : size === 'lg' ? 68 : 80;
  const textSize =
    size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-4xl';

  return (
    <View className="items-center justify-center">
      <View
        style={{ width: iconBoxSize, height: iconBoxSize }}
        className="items-center justify-center rounded-2xl bg-white shadow-md shadow-black/10 border border-green-50 mb-2"
      >
        <View className="relative items-center justify-center">
          <Text className="text-2xl font-black text-[#1C7430]">P</Text>
          <View className="absolute -top-1 -right-2 transform rotate-12">
            <Leaf size={14} color="#EA580C" fill="#EA580C" />
          </View>
        </View>
      </View>

      {showText && (
        <View className="items-center">
          <View className="flex-row items-center space-x-1">
            <Leaf size={size === 'sm' ? 16 : 20} color="#1C7430" fill="#1C7430" />
            <Text
              style={{ color: textColor }}
              className={`${textSize} font-extrabold tracking-tight ml-1`}
            >
              Pekarang.In
            </Text>
          </View>
          {subText && (
            <Text className="text-xs text-gray-500 text-center mt-1 max-w-[260px]">
              {subText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

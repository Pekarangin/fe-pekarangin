import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'neutral' | 'error' | 'outline' | 'farmer';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'success',
  size = 'sm',
  icon,
}) => {
  const variantStyles = {
    success: 'bg-[#E8F5E9] text-[#1C7430] border-[#C8E6C9]',
    warning: 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]',
    info: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    error: 'bg-red-50 text-red-600 border-red-200',
    outline: 'bg-white text-gray-700 border-gray-300',
    farmer: 'bg-[#1C7430] text-white border-transparent',
  };

  const textStyles = {
    success: 'text-[#1C7430]',
    warning: 'text-[#E65100]',
    info: 'text-[#0369A1]',
    neutral: 'text-gray-700',
    error: 'text-red-600',
    outline: 'text-gray-700',
    farmer: 'text-white font-semibold',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 rounded-full',
    md: 'px-3.5 py-1.5 rounded-full',
  };

  const textSizes = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-semibold',
  };

  return (
    <View
      className={`flex-row items-center border ${variantStyles[variant]} ${sizeClasses[size]}`}
    >
      {icon && <View className="mr-1.5">{icon}</View>}
      <Text className={`${textStyles[variant]} ${textSizes[size]}`}>
        {label}
      </Text>
    </View>
  );
};

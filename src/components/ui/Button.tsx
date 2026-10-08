import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'secondary' | 'google';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const sizeClasses = {
    sm: 'py-2.5 px-4 rounded-xl',
    md: 'py-3.5 px-6 rounded-2xl',
    lg: 'py-4 px-8 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg font-bold',
  };

  const variantStyles = {
    primary: 'bg-[#1C7430] border border-transparent shadow-sm shadow-[#1C7430]/30',
    outline: 'bg-white border border-gray-300',
    secondary: 'bg-[#E8F5E9] border border-transparent',
    google: 'bg-white border border-gray-300 shadow-sm shadow-black/5',
  };

  const textStyles = {
    primary: 'text-white text-center',
    outline: 'text-gray-700 text-center',
    secondary: 'text-[#1C7430] text-center',
    google: 'text-gray-700 text-center',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center ${variantStyles[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#1C7430'}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2.5">{icon}</View>}
          <Text className={`${textStyles[variant]} ${textSizes[size]}`}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

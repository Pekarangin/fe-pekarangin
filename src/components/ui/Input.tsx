import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-sm font-semibold text-gray-800 mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-[#F9FAFB] border rounded-2xl px-3.5 py-3 ${
          error
            ? 'border-red-500 bg-red-50'
            : isFocused
            ? 'border-[#1C7430] bg-white'
            : 'border-gray-200'
        } ${className}`}
      >
        {leftIcon && <View className="mr-2.5 opacity-70">{leftIcon}</View>}

        <TextInput
          className="flex-1 text-base text-gray-900 font-medium py-0"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1 opacity-70"
          >
            {showPassword ? (
              <EyeOff size={18} color="#6B7280" />
            ) : (
              <Eye size={18} color="#6B7280" />
            )}
          </TouchableOpacity>
        ) : (
          rightIcon && <View className="ml-2.5 opacity-70">{rightIcon}</View>
        )}
      </View>

      {error && <Text className="text-xs text-red-500 mt-1 ml-1">{error}</Text>}
    </View>
  );
};

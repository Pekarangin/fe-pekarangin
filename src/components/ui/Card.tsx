import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  variant?: 'white' | 'green' | 'softOrange' | 'subtle';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'white',
  style,
  ...props
}) => {
  const variantStyles = {
    white: 'bg-white border border-gray-100 shadow-sm shadow-black/5',
    green: 'bg-[#1C7430] border-transparent shadow-md shadow-[#1C7430]/30',
    softOrange: 'bg-[#FFEDD5] border border-[#FED7AA]',
    subtle: 'bg-[#F9FAFB] border border-gray-100',
  };

  return (
    <View
      className={`rounded-3xl p-5 ${variantStyles[variant]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};

import React from 'react';
import {TouchableOpacity, Text, ActivityIndicator} from 'react-native';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  className = '',
}) => {
  const baseClass = 'rounded-xl items-center justify-center flex-row';

  const variants = {
    primary: 'bg-black',
    secondary: 'bg-white border border-gray-200',
    outline: 'bg-transparent border-2 border-black',
    ghost: 'bg-transparent',
  };

  const sizes = {
    small: 'px-4 py-2 min-h-[40px]',
    medium: 'px-5 py-3 min-h-[48px]',
    large: 'px-6 py-4 min-h-[56px]',
  };

  const textVariants = {
    primary: 'text-white',
    secondary: 'text-black',
    outline: 'text-black',
    ghost: 'text-black',
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const disabledClass = disabled || loading ? 'opacity-40' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${disabledClass} ${className}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#000000'} />
      ) : (
        <>
          {icon && <Text className={`mr-2 ${textVariants[variant]} ${textSizes[size]} font-barlow-semibold`}>{icon}</Text>}
          <Text className={`${textVariants[variant]} ${textSizes[size]} font-barlow-semibold`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
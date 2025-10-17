import React from 'react';
import {View, TouchableOpacity} from 'react-native';

const Card = ({
  children,
  onPress,
  variant = 'default',
  className = '',
}) => {
  const baseClass = 'rounded-2xl p-5 mb-4';

  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm',
    outlined: 'bg-white border-2 border-black',
    filled: 'bg-black',
    ghost: 'bg-transparent',
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      className={`${baseClass} ${variants[variant]} ${className}`}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Component>
  );
};

export default Card;
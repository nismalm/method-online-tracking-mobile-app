import React, {useState} from 'react';
import {View, TextInput as RNTextInput, Text} from 'react-native';

const TextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  leftIcon,
  rightIcon,
  prefix,
  className = '',
  variant = 'default', // 'default' or 'search'
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderClass = () => {
    if (variant === 'search') return ''; // No border for search variant
    if (error) return 'border-2 border-brand-darkest';
    if (isFocused) return 'border-2 border-brand-darkest';
    return 'border border-gray-200';
  };

  const getBgClass = () => {
    if (variant === 'search') return 'bg-[#f9f9f9]';
    return editable ? 'bg-white' : 'bg-gray-50';
  };

  return (
    <View className={className}>
      {label && (
        <Text className="text-brand-darkest text-sm font-barlow-semibold mb-2">
          {label}
        </Text>
      )}
      <View className={`flex-row items-center rounded-xl px-4 ${variant === 'search' ? 'py-3' : 'h-14'} ${getBorderClass()} ${getBgClass()}`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        {prefix && (
          <Text className="text-brand-darkest text-base font-barlow mr-2">
            {prefix}
          </Text>
        )}
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 text-brand-darkest text-base font-barlow"
          style={{lineHeight: 20, paddingVertical: 0}}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-brand-darkest text-xs mt-1.5 font-barlow-medium">
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
};

export default TextInput;
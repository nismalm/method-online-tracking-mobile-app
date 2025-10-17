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
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderClass = () => {
    if (error) return 'border-2 border-black';
    if (isFocused) return 'border-2 border-black';
    return 'border border-gray-200';
  };

  const bgClass = editable ? 'bg-white' : 'bg-gray-50';

  return (
    <View className={className}>
      {label && (
        <Text className="text-black text-sm font-barlow-semibold mb-2">
          {label}
        </Text>
      )}
      <View className={`flex-row items-center rounded-xl px-4 h-14 ${getBorderClass()} ${bgClass}`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        {prefix && (
          <Text className="text-black text-base font-barlow mr-2">
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
          className="flex-1 text-black text-base font-barlow"
          style={{lineHeight: 20, paddingVertical: 0}}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-black text-xs mt-1.5 font-barlow-medium">
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
};

export default TextInput;
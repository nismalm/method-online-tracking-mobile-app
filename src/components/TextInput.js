import React, {useState} from 'react';
import {View, TextInput as RNTextInput, Text, StyleSheet} from 'react-native';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

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
  autoCapitalize,
  leftIcon,
  rightIcon,
  prefix,
  style,
  variant = 'default', // 'default' or 'search'
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = () => {
    const styles = [containerStyles.base];

    if (variant === 'search') {
      styles.push(containerStyles.search);
    } else {
      styles.push(containerStyles.default);
    }

    if (error) {
      styles.push(containerStyles.error);
    } else if (isFocused && variant !== 'search') {
      styles.push(containerStyles.focused);
    } else if (variant !== 'search') {
      styles.push(containerStyles.normal);
    }

    if (!editable) {
      styles.push(containerStyles.disabled);
    }

    if (style) {
      styles.push(style);
    }

    return styles;
  };

  return (
    <View>
      {label && (
        <Text style={labelStyles.label}>
          {label}
        </Text>
      )}
      <View style={getContainerStyle()}>
        {leftIcon && <View style={{marginRight: 12}}>{leftIcon}</View>}
        {prefix && (
          <Text style={prefixStyles.text}>
            {prefix}
          </Text>
        )}
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyles.input}
        />
        {rightIcon && <View style={{marginLeft: 12}}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={errorStyles.text}>
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
};

const labelStyles = StyleSheet.create({
  label: {
    color: COLORS.brandDarkest,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
});

const containerStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 16,
  },
  default: {
    height: 56,
    backgroundColor: COLORS.white,
  },
  search: {
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  normal: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  focused: {
    borderWidth: 2,
    borderColor: COLORS.brandDarkest,
  },
  error: {
    borderWidth: 2,
    borderColor: COLORS.brandDarkest,
  },
  disabled: {
    backgroundColor: COLORS.gray50,
  },
});

const prefixStyles = StyleSheet.create({
  text: {
    color: COLORS.brandDarkest,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    marginRight: 8,
  },
});

const inputStyles = StyleSheet.create({
  input: {
    flex: 1,
    color: COLORS.brandDarkest,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    paddingVertical: 0,
  },
});

const errorStyles = StyleSheet.create({
  text: {
    color: COLORS.brandDarkest,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginTop: 6,
  },
});

export default TextInput;

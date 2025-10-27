import React from 'react';
import {TouchableOpacity, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  const getButtonStyle = () => {
    const styles = [baseStyles.base];
    
    // Add variant style
    switch (variant) {
      case 'primary':
        styles.push(baseStyles.primary);
        break;
      case 'secondary':
        styles.push(baseStyles.secondary);
        break;
      case 'outline':
        styles.push(baseStyles.outline);
        break;
      case 'ghost':
        styles.push(baseStyles.ghost);
        break;
    }
    
    // Add size style
    switch (size) {
      case 'small':
        styles.push(baseStyles.small);
        break;
      case 'medium':
        styles.push(baseStyles.medium);
        break;
      case 'large':
        styles.push(baseStyles.large);
        break;
    }
    
    // Add disabled style
    if (disabled || loading) {
      styles.push(baseStyles.disabled);
    }
    
    // Add custom style
    if (style) {
      styles.push(style);
    }
    
    return styles;
  };

  const getTextStyle = () => {
    const styles = [];
    
    // Add variant text style
    switch (variant) {
      case 'primary':
        styles.push(textStyles.primary);
        break;
      case 'secondary':
      case 'outline':
      case 'ghost':
        styles.push(textStyles.dark);
        break;
    }
    
    // Add size text style
    switch (size) {
      case 'small':
        styles.push(textStyles.small);
        break;
      case 'medium':
        styles.push(textStyles.medium);
        break;
      case 'large':
        styles.push(textStyles.large);
        break;
    }
    
    return styles;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={getButtonStyle()}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.black} />
      ) : (
        <>
          {icon && <Text style={[getTextStyle(), {marginRight: 8}]}>{icon}</Text>}
          <Text style={getTextStyle()}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: COLORS.black,
  },
  secondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  medium: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.4,
  },
});

const textStyles = StyleSheet.create({
  primary: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
  },
  dark: {
    color: COLORS.black,
    fontFamily: FONTS.semiBold,
  },
  small: {
    fontSize: FONT_SIZES.sm,
  },
  medium: {
    fontSize: FONT_SIZES.base,
  },
  large: {
    fontSize: FONT_SIZES.lg,
  },
});

export default Button;

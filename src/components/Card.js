import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {COLORS, BORDER_RADIUS, SHADOWS} from '../constants/theme';

const Card = ({
  children,
  onPress,
  variant = 'default',
  style,
}) => {
  const getCardStyle = () => {
    const styles = [cardStyles.base];

    switch (variant) {
      case 'default':
        styles.push(cardStyles.default);
        break;
      case 'outlined':
        styles.push(cardStyles.outlined);
        break;
      case 'filled':
        styles.push(cardStyles.filled);
        break;
      case 'ghost':
        styles.push(cardStyles.ghost);
        break;
    }

    if (style) {
      styles.push(style);
    }

    return styles;
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      style={getCardStyle()}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Component>
  );
};

const cardStyles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    marginBottom: 16,
  },
  default: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  outlined: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  filled: {
    backgroundColor: COLORS.black,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

export default Card;

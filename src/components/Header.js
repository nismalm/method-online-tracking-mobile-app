import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {COLORS, FONTS, FONT_SIZES} from '../constants/theme';

const Header = ({title, subtitle}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        {title && (
          <Text style={styles.title}>
            {title}
          </Text>
        )}
      </View>
      <Image
        source={require('../../assets/logo/method_logo_lg.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 4,
    color: COLORS.brandTextSecondary,
  },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.bold,
    color: COLORS.brandDarkest,
  },
  logo: {
    width: 100,
    height: 60,
  },
});

export default Header;

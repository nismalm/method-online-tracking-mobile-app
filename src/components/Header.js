import React from 'react';
import {View, Text, Image} from 'react-native';

const Header = ({title, subtitle}) => {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <View className="flex-1">
        {subtitle && (
          <Text className="text-sm font-barlow mb-1 text-brand-text-secondary">
            {subtitle}
          </Text>
        )}
        {title && (
          <Text className="text-3xl font-barlow-bold text-brand-darkest">
            {title}
          </Text>
        )}
      </View>
      <Image
        source={require('../../assets/logo/method_logo_lg.png')}
        className="w-[100px] h-[60px]"
        resizeMode="contain"
      />
    </View>
  );
};

export default Header;

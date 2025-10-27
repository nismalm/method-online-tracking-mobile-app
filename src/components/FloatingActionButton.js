import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {COLORS} from '../constants/theme';

const FloatingActionButton = ({icon, onPress, backgroundColor}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {backgroundColor: backgroundColor || COLORS.brandPrimary},
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default FloatingActionButton;

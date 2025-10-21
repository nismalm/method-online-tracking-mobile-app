import React from 'react';
import {TouchableOpacity} from 'react-native';

const FloatingActionButton = ({icon, onPress, backgroundColor}) => {
  return (
    <TouchableOpacity
      className="absolute right-4 bottom-5 w-14 h-14 rounded-full items-center justify-center"
      style={{
        backgroundColor: backgroundColor || '#e0fe66',
        elevation: 8, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      }}
      onPress={onPress}
      activeOpacity={0.8}>
      {icon}
    </TouchableOpacity>
  );
};

export default FloatingActionButton;

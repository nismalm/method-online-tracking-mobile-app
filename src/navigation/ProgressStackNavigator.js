import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DailyProgressScreen from '../screens/DailyProgressScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';

const Stack = createNativeStackNavigator();

const ProgressStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="DailyProgress" component={DailyProgressScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    </Stack.Navigator>
  );
};

export default ProgressStackNavigator;

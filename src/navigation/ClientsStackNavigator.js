import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ClientsScreen from '../screens/ClientsScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';

const Stack = createNativeStackNavigator();

const ClientsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="ClientsList" component={ClientsScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    </Stack.Navigator>
  );
};

export default ClientsStackNavigator;





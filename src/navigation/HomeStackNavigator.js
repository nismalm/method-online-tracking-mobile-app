import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DietChartBuilderScreen from '../screens/DietChartBuilderScreen';
import DietChartPreviewScreen from '../screens/DietChartPreviewScreen';
import {COLORS, FONTS, FONT_SIZES} from '../constants/theme';

const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.brandDarkest,
        headerTitleStyle: {
          fontFamily: FONTS.semiBold,
          fontSize: FONT_SIZES.lg,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="DietChartBuilder"
        component={DietChartBuilderScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DietChartPreview"
        component={DietChartPreviewScreen}
        options={{
          title: 'Preview Diet Chart',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;

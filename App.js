import React from 'react';
import {View, ActivityIndicator, Text, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import LoginScreen from './src/screens/LoginScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'auth/email-already-in-use',
  'auth/invalid-credential',
  'firestore/failed-precondition',
  'Setting a timer', // Firebase real-time listeners
  'VirtualizedLists should never be nested', // If any list nesting occurs
]);

function AppContent() {
  const {user, userProfile, loading} = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="mt-4 text-gray-600 font-barlow">Loading...</Text>
      </View>
    );
  }

  // Show LoginScreen if no user, no profile, or user is inactive
  if (!user || !userProfile) {
    return <LoginScreen />;
  }

  // Additional check: if user is inactive and not SuperAdmin, show login screen
  if (userProfile.status !== 'active' && userProfile.role !== 'SuperAdmin') {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
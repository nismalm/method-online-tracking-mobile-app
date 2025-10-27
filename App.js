import React, {useState, useEffect, useCallback} from 'react';
import {View, ActivityIndicator, Text, LogBox, StyleSheet, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import LoginScreen from './src/screens/LoginScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import {COLORS, FONTS} from './src/constants/theme';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'auth/email-already-in-use',
  'auth/invalid-credential',
  'firestore/failed-precondition',
  'Setting a timer', // Firebase real-time listeners
  'VirtualizedLists should never be nested', // If any list nesting occurs
]);

// App initialization
if (__DEV__) {
  console.log('App Starting -', Platform.OS);
}

// Global error handler to catch unhandled errors
if (!__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError(...args);
    // In production, log errors that might cause black screen
    console.log('ERROR CAUGHT:', JSON.stringify(args));
  };
}

// Font Loading Component
function FontLoader({children}) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(null);

  const loadFonts = useCallback(async () => {
    try {
      // Small delay to ensure native bridge is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      setFontsLoaded(true);
    } catch (error) {
      console.error('Font initialization error:', error);
      setFontError(error);
      setFontsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#040404" />
        <Text style={styles.loadingTextSystem}>Loading...</Text>
      </View>
    );
  }

  return children;
}

function AppContent() {
  const {user, userProfile, loading, error} = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.black} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.loadingText}>Please restart the app</Text>
      </View>
    );
  }

  if (!user || !userProfile) {
    return <LoginScreen />;
  }

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
      <FontLoader>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </FontLoader>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.gray600,
    fontFamily: FONTS.regular,
    fontSize: 16,
  },
  loadingTextSystem: {
    marginTop: 16,
    color: '#4b5563',
    fontSize: 16,
    // Use system font for initial loading before custom fonts are ready
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default App;

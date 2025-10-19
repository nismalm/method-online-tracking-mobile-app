import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator, Text} from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import AuthService from './src/services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = AuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="mt-4 text-gray-600 font-barlow">Loading...</Text>
      </View>
    );
  }

  // Show LoginScreen if no user, else show HomeScreen
  if (!user) {
    return <LoginScreen />;
  }

  // Temporary home screen (replace with your actual HomeScreen component)
  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-2xl font-barlow-bold mb-4">Welcome!</Text>
      <Text className="text-base font-barlow text-gray-600 mb-8 text-center">
        You are logged in as:{'\n'}{user.email}
      </Text>
      <Text
        className="text-blue-600 font-barlow-medium"
        onPress={async () => {
          await AuthService.signOut();
        }}>
        Sign Out
      </Text>
    </View>
  );
}

export default App;
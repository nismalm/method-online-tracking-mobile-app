import React, {useState} from 'react';
import {
  View,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import {TextInput, Button} from '../components';
import MailIcon from '../../assets/icons/mailIcon';
import PasswordIcon from '../../assets/icons/passwordIcon';
import AuthService from '../services/authService';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.signIn(email, password);

      if (result.success) {
        // Login successful - auth state listener in App.js will handle navigation
        console.log('Login successful:', result.user.email);
      } else {
        // Show error message
        Alert.alert('Login Failed', result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address to reset password.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset email to ${email}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              await AuthService.resetPassword(email);
              // Always show success message for security (prevent email enumeration)
              Alert.alert(
                'Email Sent',
                'Password reset instructions have been sent. Please check your inbox and spam folder.'
              );
            } catch (error) {
              // Show generic message even on error for security
              Alert.alert(
                'Email Sent',
                'Password reset instructions have been sent. Please check your inbox and spam folder.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEmailChange = (text) => {
    setEmail(text.trim());
    setEmailError('');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordError('');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-2">
          <Image
            source={require('../../assets/logo/method_logo_lg.png')}
            className="w-60 h-60"
            resizeMode="contain"
          />
        </View>

        <View className="mb-2">
          <TextInput
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<MailIcon width={20} height={20} stroke="#666666" />}
            error={emailError}
          />
        </View>

        <View className="mb-8">
          <TextInput
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="Enter your password"
            secureTextEntry
            leftIcon={<PasswordIcon width={20} height={20} stroke="#666666" />}
            error={passwordError}
          />
        </View>

        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          size="large"
          disabled={!email || !password}
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          className="mt-4 items-center">
          <Text className="text-gray-600 text-sm font-barlow-medium">
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
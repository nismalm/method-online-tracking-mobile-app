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
  StyleSheet,
} from 'react-native';
import {TextInput, Button} from '../components';
import MailIcon from '../../assets/icons/mailIcon';
import PasswordIcon from '../../assets/icons/passwordIcon';
import AuthService from '../services/authService';
import {COLORS, FONTS, FONT_SIZES} from '../constants/theme';

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo/method_logo_lg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.emailInputContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<MailIcon width={20} height={20} stroke={COLORS.brandTextLight} />}
            error={emailError}
          />
        </View>

        <View style={styles.passwordInputContainer}>
          <TextInput
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="Enter your password"
            secureTextEntry
            leftIcon={<PasswordIcon width={20} height={20} stroke={COLORS.brandTextLight} />}
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
          style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 240,
    height: 240,
  },
  emailInputContainer: {
    marginBottom: 8,
  },
  passwordInputContainer: {
    marginBottom: 32,
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: COLORS.gray600,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
});

export default LoginScreen;
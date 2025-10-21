import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {TextInput, Button} from '../components';
import AuthService from '../services/authService';
import {useAuth} from '../context/AuthContext';

const AddTrainerModal = ({visible, onClose, onTrainerAdded}) => {
  const {user} = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('+91');
  const [loading, setLoading] = useState(false);

  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({
    email: '',
    password: '',
  });

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateMobile = (mobileValue) => {
    // Indian mobile number validation: +91 followed by 10 digits
    const mobileRegex = /^\+91[0-9]{10}$/;
    return mobileRegex.test(mobileValue);
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const copyAllCredentials = () => {
    const text = `Trainer Login Credentials\n\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    Clipboard.setString(text);
    Alert.alert('Copied!', 'All credentials copied to clipboard');
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setNameError('');
    setEmailError('');
    setMobileError('');

    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Validate mobile
    if (!mobile.trim()) {
      setMobileError('Mobile number is required');
      return;
    }
    if (!validateMobile(mobile.trim())) {
      setMobileError('Mobile must be in format: +91XXXXXXXXXX');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.createTrainer(
        name.trim(),
        email.trim().toLowerCase(),
        mobile.trim(),
        user.uid
      );

      if (result.success) {
        // FIXED: Use new handler to avoid modal nesting
        handleTrainerCreated(email.trim(), result.password);
        if (onTrainerAdded) {
          onTrainerAdded();
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to create trainer');
      }
    } catch (error) {
      console.error('Create trainer error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setMobile('+91');
    setNameError('');
    setEmailError('');
    setMobileError('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  // FIXED: Close main modal before showing success modal to prevent nesting
  const handleTrainerCreated = (email, password) => {
    setCreatedCredentials({
      email: email,
      password: password,
    });
    // Close main modal first
    onClose();
    // Small delay to ensure modal closes before showing success
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[90%]">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-barlow-bold text-gray-900">
                Add New Trainer
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                className="p-2">
                <Text className="text-gray-500 text-2xl font-barlow-medium">
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View className="mb-4">
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setNameError('');
                  }}
                  placeholder="Enter trainer's full name"
                  autoCapitalize="words"
                  error={nameError}
                  editable={!loading}
                />
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  placeholder="trainer@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={emailError}
                  editable={!loading}
                />
                <Text className="text-xs text-gray-500 mt-1 font-barlow">
                  Trainer will use this email to login
                </Text>
              </View>

              {/* Mobile Input */}
              <View className="mb-4">
                <TextInput
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={(text) => {
                    // If user completely clears the field, reset to +91
                    if (text === '') {
                      setMobile('+91');
                    }
                    // If user is typing and removed the +91 prefix, restore it
                    else if (!text.startsWith('+91')) {
                      // Extract just the numbers
                      const numbers = text.replace(/\D/g, '');
                      setMobile('+91' + numbers);
                    }
                    // Normal case - user is typing after +91
                    else {
                      setMobile(text);
                    }
                    setMobileError('');
                  }}
                  placeholder="+91XXXXXXXXXX"
                  keyboardType="phone-pad"
                  error={mobileError}
                  editable={!loading}
                />
                <Text className="text-xs text-gray-500 mt-1 font-barlow">
                  Format: +91 followed by 10 digits
                </Text>
              </View>

              {/* Info Box */}
              <View className="bg-blue-50 p-4 rounded-xl mb-6">
                <Text className="text-sm text-blue-800 font-barlow-medium mb-1">
                  Password Setup
                </Text>
                <Text className="text-xs text-blue-600 font-barlow">
                  A password reset email will be sent to the trainer. They can
                  use it to set their own password before logging in.
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    title="Cancel"
                    onPress={handleClose}
                    variant="outline"
                    disabled={loading}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Create Trainer"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading || !name || !email || !mobile}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal - Now separated to avoid nesting */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleSuccessModalClose}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            {/* Success Icon */}
            <View className="items-center mb-4">
              <View className="bg-brand-dark rounded-full w-16 h-16 items-center justify-center mb-3">
                <Text className="text-brand-secondary text-3xl font-barlow-bold">
                  ✓
                </Text>
              </View>
              <Text className="text-xl font-barlow-bold text-gray-900">
                Trainer Created Successfully
              </Text>
              <Text className="text-sm text-gray-600 font-barlow mt-1 text-center">
                Trainer account created!
              </Text>
            </View>

            {/* Credentials */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              {/* Email */}
              <View className="mb-3">
                <Text className="text-xs text-gray-500 font-barlow-medium mb-1">
                  EMAIL
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-gray-900 font-barlow-medium flex-1">
                    {createdCredentials.email}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyToClipboard(createdCredentials.email, 'Email')
                    }
                    className="ml-2 bg-brand-dark px-3 py-1.5 rounded-lg">
                    <Text className="text-brand-secondary text-xs font-barlow-bold">
                      COPY
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password */}
              <View>
                <Text className="text-xs text-gray-500 font-barlow-medium mb-1">
                  PASSWORD
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-gray-900 font-barlow-bold flex-1">
                    {createdCredentials.password}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyToClipboard(createdCredentials.password, 'Password')
                    }
                    className="ml-2 bg-brand-dark px-3 py-1.5 rounded-lg">
                    <Text className="text-brand-secondary text-xs font-barlow-bold">
                      COPY
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Copy All Button */}
            <TouchableOpacity
              onPress={copyAllCredentials}
              className="bg-brand-dark py-3 rounded-xl mb-4">
              <Text className="text-brand-secondary text-center font-barlow-bold text-base">
                Copy All Credentials
              </Text>
            </TouchableOpacity>

            {/* Info Message */}
            <View className="bg-brand-white p-3 rounded-xl mb-4">
              <Text className="text-xs text-brand-dark font-barlow text-center">
                A password reset email will be sent to the trainer. They can
                use it to set their own password.
              </Text>
            </View>

            {/* OK Button */}
            <Button title="OK" onPress={handleSuccessModalClose} />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default AddTrainerModal;

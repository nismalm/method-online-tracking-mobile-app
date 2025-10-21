import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {TextInput, Button} from '../components';
import AuthService from '../services/authService';

const EditTrainerModal = ({visible, onClose, trainer, onTrainerUpdated}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');

  // Populate fields when trainer changes
  useEffect(() => {
    if (trainer) {
      setName(trainer.name || '');
      setEmail(trainer.email || '');
      setMobile(trainer.mobile || '');
    }
  }, [trainer]);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateMobile = (mobileValue) => {
    const mobileRegex = /^\+91[0-9]{10}$/;
    return mobileRegex.test(mobileValue);
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
      const result = await AuthService.updateTrainer(
        trainer.uid,
        name.trim(),
        email.trim().toLowerCase(),
        mobile.trim()
      );

      if (result.success) {
        Alert.alert(
          'Trainer Updated',
          'Trainer details updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                if (onTrainerUpdated) {
                  onTrainerUpdated();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update trainer');
      }
    } catch (error) {
      console.error('Update trainer error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset errors
      setNameError('');
      setEmailError('');
      setMobileError('');
      onClose();
    }
  };

  if (!trainer) return null;

  return (
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
                Edit Trainer
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
                  Note: Changing email won't update login credentials
                </Text>
              </View>

              {/* Mobile Input */}
              <View className="mb-6">
                <TextInput
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={(text) => {
                    setMobile(text);
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
                    title="Update Trainer"
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
  );
};

export default EditTrainerModal;

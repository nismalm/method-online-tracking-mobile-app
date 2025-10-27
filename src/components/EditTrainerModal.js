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
  StyleSheet,
} from 'react-native';
import {TextInput, Button} from '../components';
import AuthService from '../services/authService';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

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
        style={styles.keyboardView}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Edit Trainer
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
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
              <View style={styles.inputContainer}>
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
                <Text style={styles.helperText}>
                  Note: Changing email won't update login credentials
                </Text>
              </View>

              {/* Mobile Input */}
              <View style={styles.inputContainerLast}>
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
                <Text style={styles.helperText}>
                  Format: +91 followed by 10 digits
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <View style={styles.buttonHalf}>
                  <Button
                    title="Cancel"
                    onPress={handleClose}
                    variant="outline"
                    disabled={loading}
                  />
                </View>
                <View style={styles.buttonHalf}>
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

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.gray500,
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.medium,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputContainerLast: {
    marginBottom: 24,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
});

export default EditTrainerModal;

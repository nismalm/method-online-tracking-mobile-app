import React, {useState, useRef} from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import {captureRef} from 'react-native-view-shot';
import Share from 'react-native-share';
import {TextInput, Button} from '../components';
import AuthService from '../services/authService';
import {useAuth} from '../context/AuthContext';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';
import ShareIcon from '../../assets/icons/shareIcon';

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
    name: '',
    email: '',
    password: '',
  });

  // Share functionality
  const credentialsRef = useRef();
  const [isSharing, setIsSharing] = useState(false);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateMobile = (mobileValue) => {
    // Indian mobile number validation: +91 followed by 10 digits
    const mobileRegex = /^\+91[0-9]{10}$/;
    return mobileRegex.test(mobileValue);
  };


  const handleShareCredentials = async () => {
    try {
      setIsSharing(true);

      // Capture the credentials section (logo + email + password) as PNG
      const uri = await captureRef(credentialsRef, {
        format: 'png',
        quality: 1.0,
      });

      // Create filename with trainer name
      const fileName = `${createdCredentials.name.replace(/\s+/g, '_')}-Credentials.png`;

      // Share the captured image using native share dialog
      await Share.open({
        url: `file://${uri}`,
        title: 'Share Trainer Credentials',
        message: 'Welcome to team METHOD!, Here is your login credentials to METHOD ONLINE TRACKING APPLICATION, you can change your password from the app & the mail received(Check for spam folder too), Thanks',
        filename: fileName,
      });

      setIsSharing(false);
    } catch (error) {
      setIsSharing(false);

      // User cancelled share - not an error
      if (error.message && error.message.includes('User did not share')) {
        return;
      }

      console.error('Share failed:', error);
      Alert.alert('Error', 'Failed to share credentials. Please try again.');
    }
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
        handleTrainerCreated(name.trim(), email.trim(), result.password);
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

  const handleTrainerCreated = (trainerName, trainerEmail, trainerPassword) => {
    setCreatedCredentials({
      name: trainerName,
      email: trainerEmail,
      password: trainerPassword,
    });
    onClose();
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
          style={styles.keyboardView}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  Add New Trainer
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
                    Trainer will use this email to login
                  </Text>
                </View>

                {/* Mobile Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Mobile Number"
                    value={mobile}
                    onChangeText={(text) => {
                      if (text === '') {
                        setMobile('+91');
                      }
                      else if (!text.startsWith('+91')) {
                        const numbers = text.replace(/\D/g, '');
                        setMobile('+91' + numbers);
                      }
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
                  <Text style={styles.helperText}>
                    Format: +91 followed by 10 digits
                  </Text>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>
                    Password Setup
                  </Text>
                  <Text style={styles.infoText}>
                    A password reset email will be sent to the trainer. They can
                    use it to set their own password before logging in.
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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleSuccessModalClose}>
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            {/* Success Icon */}
            <View style={styles.successHeader}>
              <View style={styles.successIcon}>
                <Text style={styles.successCheckmark}>
                  ✓
                </Text>
              </View>
              <Text style={styles.successTitle}>
                Trainer Created Successfully
              </Text>
              <Text style={styles.successSubtitle}>
                Trainer account created!
              </Text>
            </View>

            {/* Credentials Box (with Logo) - This section will be captured */}
            <View
              ref={credentialsRef}
              collapsable={false}
              style={styles.credentialsBox}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/logo/method_logo_lg.png')}
                  style={styles.modalLogo}
                  resizeMode="contain"
                />
              </View>

              {/* Email */}
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>
                  EMAIL
                </Text>
                <Text style={styles.credentialValue}>
                  {createdCredentials.email}
                </Text>
              </View>

              {/* Password */}
              <View>
                <Text style={styles.credentialLabel}>
                  PASSWORD
                </Text>
                <Text style={[styles.credentialValue, styles.passwordValue]}>
                  {createdCredentials.password}
                </Text>
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>

              {/* Share Button */}
              <TouchableOpacity
                onPress={handleShareCredentials}
                disabled={isSharing}
                style={[styles.actionButton, styles.shareButton, isSharing && styles.disabledButton]}>
                {isSharing ? (
                  <ActivityIndicator size="small" color={COLORS.brandSecondary} />
                ) : (
                  <View style={styles.shareButtonContent}>
                    <ShareIcon width={18} height={18} fill={COLORS.brandSecondary} />
                    <Text style={styles.shareButtonText}>
                      Share
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Message */}
            <View style={styles.successInfoBox}>
              <Text style={styles.successInfoText}>
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
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: FONT_SIZES.sm,
    color: '#1E3A8A',
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  infoText: {
    fontSize: FONT_SIZES.xs,
    color: '#2563EB',
    fontFamily: FONTS.regular,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  // Success Modal Styles
  successOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
  },
  successContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    backgroundColor: COLORS.brandDark,
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successCheckmark: {
    color: COLORS.brandSecondary,
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.bold,
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    fontFamily: FONTS.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  credentialsBox: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
    marginBottom: 16,
  },
  logoContainer: {
    marginTop: -10,
    alignItems: 'center',
  },
  modalLogo: {
    height: 90,
  },
  credentialItem: {
    marginBottom: 16,
  },
  credentialLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    fontFamily: FONTS.medium,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialValue: {
    fontSize: FONT_SIZES.base,
    color: COLORS.gray900,
    fontFamily: FONTS.bold,
  },
  passwordValue: {
    fontFamily: FONTS.bold,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyAllButton: {
    backgroundColor: COLORS.brandDark,
  },
  copyAllButtonText: {
    color: COLORS.brandSecondary,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
  },
  shareButton: {
    backgroundColor: COLORS.brandDark,
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: COLORS.brandSecondary,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
  },
  disabledButton: {
    opacity: 0.5,
  },
  successInfoBox: {
    backgroundColor: COLORS.brandWhite,
    padding: 12,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: 16,
  },
  successInfoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.brandDark,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});

export default AddTrainerModal;

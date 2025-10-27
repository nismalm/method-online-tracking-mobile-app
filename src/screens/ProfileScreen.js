import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/Header';
import {TextInput, Button} from '../components';
import AuthService from '../services/authService';
import {useAuth} from '../context/AuthContext';
import UserIcon from '../../assets/icons/userIcon';
import ChevronRightIcon from '../../assets/icons/chevronRightIcon';
import LockIcon from '../../assets/icons/lockIcon';
import BellIcon from '../../assets/icons/bellIcon';
import InfoIcon from '../../assets/icons/infoIcon';
import LogoutIcon from '../../assets/icons/logoutIcon';
import PasswordIcon from '../../assets/icons/passwordIcon';
import {COLORS, FONTS, FONT_SIZES, BORDER_RADIUS} from '../constants/theme';

const ProfileHeader = ({userProfile}) => (
  <View style={styles.profileHeader}>
    <View style={styles.avatarContainer}>
      <UserIcon width={48} height={48} stroke={COLORS.brandDarkest} />
    </View>
    <Text style={styles.profileName}>
      {userProfile?.name || 'User'}
    </Text>
    <Text style={styles.profileEmail}>
      {userProfile?.email}
    </Text>
    <View style={styles.roleBadge}>
      <Text style={styles.roleText}>
        {userProfile?.role || 'User'}
      </Text>
    </View>
  </View>
);

const MenuItem = ({icon: IconComponent, label, onPress, danger = false}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}>
    <View
      style={[
        styles.menuIconContainer,
        danger && styles.menuIconDanger,
      ]}>
      <IconComponent width={22} height={22} stroke={danger ? '#EF4444' : COLORS.brandDarkest} />
    </View>
    <Text
      style={[
        styles.menuLabel,
        danger && styles.menuLabelDanger,
      ]}>
      {label}
    </Text>
    <ChevronRightIcon width={24} height={24} stroke={COLORS.brandTextSecondary} />
  </TouchableOpacity>
);

const ChangePasswordModal = ({visible, onClose}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  const handleSubmit = async () => {
    // Clear errors
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    // Validate
    if (!currentPassword) {
      setCurrentPasswordError('Current password is required');
      return;
    }

    if (!newPassword) {
      setNewPasswordError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setNewPasswordError('Password must be at least 6 characters');
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setNewPasswordError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.changePassword(currentPassword, newPassword);

      if (result.success) {
        Alert.alert('Success', 'Password changed successfully', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Change Password
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Current Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setCurrentPasswordError('');
                  }}
                  placeholder="Enter current password"
                  secureTextEntry
                  leftIcon={<PasswordIcon width={20} height={20} stroke={COLORS.brandTextLight} />}
                  error={currentPasswordError}
                  editable={!loading}
                />
              </View>

              {/* New Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setNewPasswordError('');
                  }}
                  placeholder="Enter new password"
                  secureTextEntry
                  leftIcon={<PasswordIcon width={20} height={20} stroke={COLORS.brandTextLight} />}
                  error={newPasswordError}
                  editable={!loading}
                />
                <Text style={styles.helperText}>
                  Must be at least 6 characters
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainerLast}>
                <TextInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmPasswordError('');
                  }}
                  placeholder="Re-enter new password"
                  secureTextEntry
                  leftIcon={<PasswordIcon width={20} height={20} stroke={COLORS.brandTextLight} />}
                  error={confirmPasswordError}
                  editable={!loading}
                />
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
                    title="Change Password"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
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

const ProfileScreen = () => {
  const {userProfile, signOut} = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Header title="Profile" />

          <ProfileHeader userProfile={userProfile} />

          {/* User Info Section */}
          {userProfile && (
            <>
              <Text style={styles.sectionHeader}>
                INFORMATION
              </Text>
              <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>
                    Mobile
                  </Text>
                  <Text style={styles.infoValue}>
                    {userProfile.mobile || 'Not provided'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>
                    Status
                  </Text>
                  <Text style={[styles.infoValue, styles.capitalize]}>
                    {userProfile.status || 'Active'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Settings Section */}
          <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
            ACCOUNT
          </Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={LockIcon}
              label="Change Password"
              onPress={() => setShowPasswordModal(true)}
            />
            <MenuItem
              icon={BellIcon}
              label="Notifications"
              onPress={() => console.log('Notifications')}
            />
          </View>

          <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
            ABOUT
          </Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={InfoIcon}
              label="About"
              onPress={() => console.log('About')}
            />
          </View>

          <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
            ACTIONS
          </Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={LogoutIcon}
              label="Sign Out"
              onPress={handleSignOut}
              danger={true}
            />
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.brandPrimary,
  },
  profileName: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    marginBottom: 4,
    color: COLORS.brandDarkest,
  },
  profileEmail: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.brandSecondary,
  },
  roleText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.brandDarkest,
  },
  sectionHeader: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 16,
    color: COLORS.brandTextSecondary,
  },
  sectionHeaderSpaced: {
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.brandTextSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.brandDarkest,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandBorder,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: COLORS.brandPrimary,
  },
  menuIconDanger: {
    backgroundColor: '#FEE2E2',
  },
  menuLabel: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.base,
    color: COLORS.brandDarkest,
  },
  menuLabelDanger: {
    color: '#EF4444',
  },
  // Modal Styles
  modalContainer: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
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

export default ProfileScreen;


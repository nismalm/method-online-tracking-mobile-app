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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {User, ChevronRight, LockKeyhole, Bell, Info, LogOut} from 'lucide-react-native';
import Header from '../components/Header';
import {TextInput, Button} from '../components';
import AuthService from '../services/authService';
import {useAuth} from '../context/AuthContext';
import PasswordIcon from '../../assets/icons/passwordIcon';

const ProfileHeader = ({userProfile}) => (
  <View className="items-center mb-8">
    <View className="w-24 h-24 rounded-full items-center justify-center mb-4 bg-brand-primary">
      <User size={48} color="#040404" />
    </View>
    <Text className="text-2xl font-barlow-bold mb-1 text-brand-darkest">
      {userProfile?.name || 'User'}
    </Text>
    <Text className="text-base font-barlow text-brand-text-secondary">
      {userProfile?.email}
    </Text>
    <View className="mt-2 px-3 py-1 rounded-lg bg-brand-secondary">
      <Text className="text-sm font-barlow-semibold text-brand-darkest">
        {userProfile?.role || 'User'}
      </Text>
    </View>
  </View>
);

const MenuItem = ({icon: IconComponent, label, onPress, danger = false}) => (
  <TouchableOpacity
    className="flex-row items-center py-4 border-b border-brand-border"
    onPress={onPress}>
    <View
      className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
        danger ? 'bg-[#FEE2E2]' : 'bg-brand-primary'
      }`}>
      <IconComponent size={22} color={danger ? '#EF4444' : '#040404'} />
    </View>
    <Text
      className={`flex-1 font-barlow-medium text-base ${
        danger ? 'text-[#EF4444]' : 'text-brand-darkest'
      }`}>
      {label}
    </Text>
    <ChevronRight size={24} color="#3c3c3c" />
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
        className="flex-1">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[90%]">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-barlow-bold text-gray-900">
                Change Password
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                className="p-2">
                <Text className="text-gray-500 text-2xl font-barlow-medium">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Current Password */}
              <View className="mb-4">
                <TextInput
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setCurrentPasswordError('');
                  }}
                  placeholder="Enter current password"
                  secureTextEntry
                  leftIcon={<PasswordIcon width={20} height={20} stroke="#666666" />}
                  error={currentPasswordError}
                  editable={!loading}
                />
              </View>

              {/* New Password */}
              <View className="mb-4">
                <TextInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setNewPasswordError('');
                  }}
                  placeholder="Enter new password"
                  secureTextEntry
                  leftIcon={<PasswordIcon width={20} height={20} stroke="#666666" />}
                  error={newPasswordError}
                  editable={!loading}
                />
                <Text className="text-xs text-gray-500 mt-1 font-barlow">
                  Must be at least 6 characters
                </Text>
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <TextInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmPasswordError('');
                  }}
                  placeholder="Re-enter new password"
                  secureTextEntry
                  leftIcon={<PasswordIcon width={20} height={20} stroke="#666666" />}
                  error={confirmPasswordError}
                  editable={!loading}
                />
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1">
        <View className="px-6 py-8 pt-2">
          <Header title="Profile" />

          <ProfileHeader userProfile={userProfile} />

          {/* User Info Section */}
          {userProfile && (
            <>
              <Text className="text-sm font-barlow-semibold uppercase mb-3 mt-4 text-brand-text-secondary">
                Information
              </Text>
              <View className="bg-white border border-brand-border rounded-2xl p-4 mb-4">
                <View className="mb-3">
                  <Text className="text-xs font-barlow text-brand-text-secondary mb-1">
                    Mobile
                  </Text>
                  <Text className="text-base font-barlow-medium text-brand-darkest">
                    {userProfile.mobile || 'Not provided'}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs font-barlow text-brand-text-secondary mb-1">
                    Status
                  </Text>
                  <Text className="text-base font-barlow-medium text-brand-darkest capitalize">
                    {userProfile.status || 'Active'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Settings Section */}
          <Text className="text-sm font-barlow-semibold uppercase mb-3 mt-4 text-brand-text-secondary">
            Account
          </Text>
          <View className="bg-white">
            <MenuItem
              icon={LockKeyhole}
              label="Change Password"
              onPress={() => setShowPasswordModal(true)}
            />
            <MenuItem
              icon={Bell}
              label="Notifications"
              onPress={() => console.log('Notifications')}
            />
          </View>

          <Text className="text-sm font-barlow-semibold uppercase mb-3 mt-6 text-brand-text-secondary">
            About
          </Text>
          <View className="bg-white">
            <MenuItem
              icon={Info}
              label="About"
              onPress={() => console.log('About')}
            />
          </View>

          <Text className="text-sm font-barlow-semibold uppercase mb-3 mt-6 text-brand-text-secondary">
            Actions
          </Text>
          <View className="bg-white">
            <MenuItem
              icon={LogOut}
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

export default ProfileScreen;

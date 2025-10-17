import React, {useState} from 'react';
import {View, Text, Image, StatusBar, KeyboardAvoidingView, Platform} from 'react-native';
import {TextInput, Button} from '../components';
import PhoneIcon from '../../assets/icons/phoneIcon';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 justify-center px-6">

        <View className="items-center mb-12">
          <Image
            source={require('../../assets/logo/method_logo_lg.png')}
            className="w-64 h-64"
            resizeMode="contain"
          />
        </View>

        <View className="mb-20">
          <TextInput
            label="Mobile Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            leftIcon={<PhoneIcon width={20} height={20} stroke="#666666" />}
          />
        </View>

        <Button
          title="Get OTP"
          onPress={handleLogin}
          loading={loading}
          size="large"
        />

      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
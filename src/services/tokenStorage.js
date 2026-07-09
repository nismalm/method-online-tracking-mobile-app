import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.method.trainer.tokens';

export const saveTokens = async ({accessToken, refreshToken}) => {
  const payload = JSON.stringify({accessToken, refreshToken});
  await Keychain.setGenericPassword('tokens', payload, {service: SERVICE});
};

export const loadTokens = async () => {
  try {
    const creds = await Keychain.getGenericPassword({service: SERVICE});
    if (!creds || !creds.password) {
      return null;
    }
    return JSON.parse(creds.password);
  } catch {
    return null;
  }
};

export const clearTokens = async () => {
  await Keychain.resetGenericPassword({service: SERVICE});
};

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
  // Removed transform-remove-console to keep error logging in production builds
  // This helps with debugging Release builds on physical devices
};

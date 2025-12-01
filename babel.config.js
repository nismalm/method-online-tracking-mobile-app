module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
  // Keep console logs in production for debugging production issues
  // This helps diagnose issues when users report problems
};

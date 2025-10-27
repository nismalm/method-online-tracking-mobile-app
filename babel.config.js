module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Removed transform-remove-console to keep error logging in production builds
  // This helps with debugging Release builds on physical devices
};
